import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { 
  S3Client, 
  GetObjectCommand, 
  GetObjectCommandInput, 
  GetObjectCommandOutput,
  PutObjectCommand, 
  PutObjectCommandInput, 
  PutObjectCommandOutput,
  HeadObjectCommand, 
  HeadObjectCommandInput, 
  HeadObjectCommandOutput,
  ListObjectsV2Command, 
  ListObjectsV2CommandInput, 
  ListObjectsV2CommandOutput, 
  DeleteObjectCommandInput, 
  DeleteObjectCommand, 
  DeleteObjectCommandOutput, 
  DeleteObjectsCommandInput, 
  DeleteObjectsCommand, 
  DeleteObjectsCommandOutput,
  CopyObjectCommandInput,
  CopyObjectCommand,
  CopyObjectCommandOutput,
  WriteGetObjectResponseCommandInput,
  WriteGetObjectResponseCommand,
  WriteGetObjectResponseCommandOutput,
} from "@aws-sdk/client-s3"


const client = new S3Client({})

export async function putObject(input: PutObjectCommandInput) {
  console.log('s3::putObject', JSON.stringify(input, null, 2))
  let command = new PutObjectCommand(input)
  const response: PutObjectCommandOutput = await client.send(command)
  return response
}

export async function getObject(input: GetObjectCommandInput) {
  console.log('s3::getObject', JSON.stringify(input, null, 2))
  const command = new GetObjectCommand(input)
  const response: GetObjectCommandOutput = await client.send(command)
  return response
}

export async function copyObject(input: CopyObjectCommandInput) {
  console.log('s3::copyObject', JSON.stringify(input, null, 2))
  const command = new CopyObjectCommand(input)
  const response: CopyObjectCommandOutput = await client.send(command)
  return response
}

export async function deleteObject(input: DeleteObjectCommandInput) {
  console.log('s3::deleteObject', JSON.stringify(input, null, 2))
  const command = new DeleteObjectCommand(input)
  const response: DeleteObjectCommandOutput = await client.send(command)
  return response
}

export async function deleteObjects(input: DeleteObjectsCommandInput) {
  console.log('s3::deleteObjects', JSON.stringify(input, null, 2))
  const command = new DeleteObjectsCommand(input)
  const response: DeleteObjectsCommandOutput = await client.send(command)
  return response
}

export async function headObject(input: HeadObjectCommandInput) {
  console.log('s3::headObject', JSON.stringify(input, null, 2))
  const command = new HeadObjectCommand(input)
  const response: HeadObjectCommandOutput = await client.send(command)
  return response
}

export async function listObjectsV2(input: ListObjectsV2CommandInput) {
  console.log('s3::listObjectsV2', JSON.stringify(input, null, 2))
  const command = new ListObjectsV2Command(input)
  const response: ListObjectsV2CommandOutput = await client.send(command)
  return response
}

export async function getPreSignedUrl(input: any) {
  const expiresIn = 3600*12
  return await getSignedUrl(
    client,
    new GetObjectCommand(input),
    { expiresIn }
  )
}

export async function writeGetObjectResponse(input: WriteGetObjectResponseCommandInput) {
  console.log('s3::writeGetObjectResponse', JSON.stringify(input, null, 2))
  const command = new WriteGetObjectResponseCommand(input)
  const response: WriteGetObjectResponseCommandOutput = await client.send(command)
  return response
}