# GIS for Genomics Tutorial
Use BigQuery geospatial operators to work with genomic data

## Set up the project and dataset

This tutorial assumes that you:

1. **already** installed the GCP SDK (or are using the cloud console)
2. **already** installed `node` and `npm`
3. **already** enabled all necessary APIs.
4. **already** created a GCP project called `my-project`
5. **already** created a GCS bucket named `my-gff-bucket`

and that you:

4. **want to** use a dataset called `my-dataset` for this tutorial.
5. **want to** use a table called `my_gff` for this tutorial.

If that's all fine, you can proceed to review and copy/paste the code in the next section. Otherwise, edit it to your liking :)

## Code

### #install node package [`@gmod/gff`](https://github.com/GMOD/gff-js) to download a genome annotation file
```
npm install @gmod/gff
curl -O ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/900/626/175/GCF_900626175.1_cs10/GCF_900626175.1_cs10_genomic.gff.gz
```

### #set up your console and creats the dataset `$DATASET`.
```
export PROJECT=my-project
export DATASET=my_dataset
export BUCKET=my-gff-bucket
export TABLE=my_gff

#create the dataset
bq --project=$PROJECT mk $DATASET
```

### #convert the [GFF](https://github.com/The-Sequence-Ontology/Specifications/blob/master/gff3.md)-formatted file into [JSONL](http://jsonlines.org/) format.
```
gzip -dc GCF_900626175.1_cs10_genomic.gff.gz > input.gff
node --max-old-space-size=8192 parse-gff.js  > input.jsonl
```

### #upload the JSONL file to Google Cloud Storage
```
gsutil cp input.jsonl gs://$BUCKET/
```

### #load the data into a new table `$TABLE` using the schema defined in the [`gff-schema.json`](gff-schema.json) schema.
```
bq --project=$PROJECT $DATASET.$TABLE gs://$BUCKET/input.jsonl ./gff-schema.json
```

## # Query the table
```
```

### # Extra stuff
#### # 1. query to convert variant schema to use the GEOGRAPHY type
```
SELECT 
reference_name,start_position,end_position,
ST_MAKELINE(ST_GEOGPOINT(start_position/POWER(10,7),0),ST_GEOGPOINT(end_position/POWER(10,7),0)) AS geometry,
reference_bases,alternate_bases,names,quality,filter,call
FROM `$PROJECT:$DATASET.$TABLE`
```

#### # 2. query to join GFF schema and VCF schema tables, we'll use the [`genomics_cannabis`](https://console.cloud.google.com/bigquery?p=bigquery-public-data&d=genomics_cannabis&page=dataset) dataset as an example.
```
WITH win AS (
  SELECT
    reference_name AS ref,
    CAST(FLOOR(start_position / 10000) AS INT64) AS win10k,
    geometry,
    call.name AS sample_id
  FROM
    `bigquery-public-data.genomics_cannabis.cs10_var` AS var JOIN UNNEST(call) AS call
  WHERE
    --samples that are not homozygous reference
    call.genotype[SAFE_ORDINAL(1)] > 0 OR (call.genotype[SAFE_ORDINAL(2)] IS NOT NULL AND call.genotype[SAFE_ORDINAL(2)] > 0)
)

SELECT
  win.ref AS chrom,
  win10k,
  COUNT(win.sample_id)/10000 AS cds_variant_density
FROM 
  win,
  `bigquery-public-data.genomics_cannabis.cs10_gff` AS gff
WHERE TRUE
  AND gff.seq_id = win.ref
  AND ST_INTERSECTS(gff.geometry,win.geometry)
  AND gff.type = 'CDS'
  AND gff.seq_id = 'chr1'
GROUP BY
  chrom,
  win10k
ORDER BY
   chrom,
   win10k,
   cds_variant_density DESC  
```

#### # 3. count the number of strains that differ from reference at each position that overlaps a CDS. 
#this query is inspirced by [@deflaux](https://github.com/deflaux)'s [variant hotspots(https://github.com/googlegenomics/bigquery-examples/blob/master/1000genomes/sql/variant-hotspots.sql) query.
```
SELECT  
  gff.seq_id AS chrom,gff.start,gff.end,gff.type,COUNT(call.name)
FROM 
  `bigquery-public-data.genomics_cannabis.cs10_gff` AS gff,
  `bigquery-public-data.genomics_cannabis.cs10_var` AS var JOIN UNNEST(call) AS call
WHERE TRUE
  --samples that are not homozygous reference
  AND call.genotype[SAFE_ORDINAL(1)] > 0 OR (call.genotype[SAFE_ORDINAL(2)] IS NOT NULL AND call.genotype[SAFE_ORDINAL(2)] > 0)
  AND gff.seq_id = var.reference_name
  AND ST_INTERSECTS(gff.geometry,var.geometry)
  AND gff.type = 'CDS'
GROUP BY
  chrom,gff.start,gff.end,gff.type
ORDER BY
   chrom,
   gff.start
```

#### # 4. create a partitioned and clustered table
```
--first run this manually, as a table scan is not permitted in a PARTITION declartion
--SELECT MAX(k) FROM (SELECT ROW_NUMBER() OVER() AS k,x.z FROM (SELECT seq_id AS z FROM `bigquery-public-data.genomics_cannabis.cs10_gff` GROUP BY z ORDER BY seq_id) AS x) AS x

CREATE TABLE `cannabis-3k.geo_experiment.cs10_gff_refpart`
PARTITION BY RANGE_BUCKET(_part, GENERATE_ARRAY(0, 221, 1))
CLUSTER BY geometry

AS

SELECT gff.*,refpart.k AS _part
FROM
  (
    SELECT ROW_NUMBER() OVER() AS k,x.seq_id
    FROM (SELECT seq_id FROM `bigquery-public-data.genomics_cannabis.cs10_gff` AS gff GROUP BY seq_id ORDER BY seq_id) AS x
    ORDER BY seq_id
  ) AS refpart,
  `bigquery-public-data.genomics_cannabis.cs10_gff` AS gff
WHERE
  refpart.seq_id = gff.seq_id

```

