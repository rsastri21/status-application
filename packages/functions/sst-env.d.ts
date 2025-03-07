/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "Api": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "ApiAuthorizerRequestAuthorizerFunction": {
      "name": string
      "type": "sst.aws.Function"
    }
    "Images": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "PostTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "RelationshipTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "Router": {
      "type": "sst.aws.Router"
      "url": string
    }
    "SessionTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "UserTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
  }
}
