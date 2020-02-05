# GIS for Genomics Tutorial
Use BigQuery geospatial operators to work with genomic data

## Set up the project and dataset

This tutorial assumes that you:

1. **already** installed the GCP SDK (or are using the cloud console)
2. **already** enabled all necessary APIs.
3. **already** created a GCP project called `my-project`

and that you:

4. **want to** use a dataset called `my-dataset` for this tutorial.
5. **want to** use a table called `my_gff` for this tutorial.

If that's all fine, you can proceed to review and copy/paste the code in the next section. Otherwise, edit it to your liking :)

## Code
~~~
export PROJECT=my-project
export DATASET=my_dataset
export TABLE=my_gff

#create the dataset
bq --project=$PROJECT mk $DATASET

#[the schema](gff-schema.json)
bq --project=$PROJECT $DATASET.$TABLE gs://mybucket/info.csv ./gff-schema.json
```
