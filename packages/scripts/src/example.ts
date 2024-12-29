import { Resource } from "sst";
import { Example } from "@status-application/core/example";

console.log(`${Example.hello()} Linked to ${Resource.MyBucket.name}.`);
