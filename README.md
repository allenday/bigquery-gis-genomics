# GIS for Genomics Tutorial
Use BigQuery geospatial operators to work with genomic data

## Set up the project and dataset

This tutorial assumes that you:

1. **already** installed the GCP SDK (or are using the cloud console)
2. **already** installed `node` and `npm`
3. **already** enabled all necessary APIs.
4. **already** created a GCP project called `my-project`

and that you:

4. **want to** use a dataset called `my-dataset` for this tutorial.
5. **want to** use a table called `my_gff` for this tutorial.

If that's all fine, you can proceed to review and copy/paste the code in the next section. Otherwise, edit it to your liking :)

## Code

### #install node package [`@gmod/gff`](https://github.com/GMOD/gff-js) to download and process a GFF file
```
npm install @gmod/gff
curl -O ftp://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/900/626/175/GCF_900626175.1_cs10/GCF_900626175.1_cs10_genomic.gff.gz
gzip -dc GCF_900626175.1_cs10_genomic.gff.gz > input.gff
node --max-old-space-size=8192 parse-gff.js  > input.jsonl
```

### #set up your console and creats the dataset `$DATASET`.
```
export PROJECT=my-project
export DATASET=my_dataset
export TABLE=my_gff

#create the dataset
bq --project=$PROJECT mk $DATASET
```

### #convert the example volvox.gff GFF file into [JSONL](http://jsonlines.org/) format.
```
```

### #load the data into a new table `$TABLE` using the schema defined in the [`gff-schema.json`](gff-schema.json) schema.

```
bq --project=$PROJECT $DATASET.$TABLE gs://mybucket/info.csv ./gff-schema.json
```
