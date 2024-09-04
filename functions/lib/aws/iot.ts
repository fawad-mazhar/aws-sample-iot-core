import { 
  IoTClient, 
  ListThingsCommand, 
  ListThingsCommandInput, 
  ListThingsCommandOutput,
  DescribeThingCommandInput, 
  DescribeThingCommand, 
  DescribeThingCommandOutput, 
  CreateThingCommandInput, 
  CreateThingCommand, 
  CreateThingCommandOutput, 
  UpdateThingCommandInput, 
  UpdateThingCommand, 
  UpdateThingCommandOutput, 
  DeleteThingCommandInput, 
  DeleteThingCommand, 
  DeleteThingCommandOutput, 
  AddThingToThingGroupCommandInput, 
  AddThingToThingGroupCommand, 
  AddThingToThingGroupCommandOutput, 
  ListThingPrincipalsCommand, 
  ListThingPrincipalsCommandInput, 
  ListThingPrincipalsCommandOutput, 
  CreateKeysAndCertificateCommand, 
  CreateKeysAndCertificateCommandInput, 
  CreateKeysAndCertificateCommandOutput, 
  AttachThingPrincipalCommandInput, 
  AttachThingPrincipalCommand, 
  AttachThingPrincipalCommandOutput, 
  UpdateCertificateCommandInput, 
  UpdateCertificateCommand, 
  UpdateCertificateCommandOutput, 
  ListPrincipalThingsCommandInput, 
  ListPrincipalThingsCommand, 
  ListPrincipalThingsCommandOutput, 
  DetachThingPrincipalCommandInput, 
  DetachThingPrincipalCommand, 
  DetachThingPrincipalCommandOutput, 
  DeleteCertificateCommandInput, 
  DeleteCertificateCommand, 
  DeleteCertificateCommandOutput,
  UpdateEventConfigurationsCommand,
  UpdateEventConfigurationsCommandInput,
  UpdateEventConfigurationsCommandOutput,
  UpdateIndexingConfigurationCommandInput,
  UpdateIndexingConfigurationCommand,
  UpdateIndexingConfigurationCommandOutput,
  CreateThingGroupCommandInput,
  CreateThingGroupCommand,
  CreateThingGroupCommandOutput,
  AttachPolicyCommandInput,
  AttachPolicyCommand,
  AttachPolicyCommandOutput,
  CreateThingTypeCommandInput,
  CreateThingTypeCommand,
  CreateThingTypeCommandOutput
} from "@aws-sdk/client-iot"

import { 
  IoTDataPlaneClient, 
  ListNamedShadowsForThingCommand,
  ListNamedShadowsForThingCommandInput,
  ListNamedShadowsForThingCommandOutput,
  GetThingShadowCommandInput,
  GetThingShadowCommand,
  GetThingShadowCommandOutput,
  PublishCommand,
  PublishCommandInput,
  PublishCommandOutput
} from "@aws-sdk/client-iot-data-plane" 

const iotClient = new IoTClient({})
const iotDataClient = new IoTDataPlaneClient({})

export async function listThings(input: ListThingsCommandInput) {
  const command = new ListThingsCommand(input)
  const response: ListThingsCommandOutput = await iotClient.send(command)
  return response
}

export async function describeThing(input: DescribeThingCommandInput) {
  const command = new DescribeThingCommand(input)
  const response: DescribeThingCommandOutput = await iotClient.send(command)
  return response
}

export async function createThing(input: CreateThingCommandInput) {
  const command = new CreateThingCommand(input)
  const response: CreateThingCommandOutput = await iotClient.send(command)
  return response
}

export async function updateThing(input: UpdateThingCommandInput) {
  const command = new UpdateThingCommand(input)
  const response: UpdateThingCommandOutput = await iotClient.send(command)
  return response
}

export async function deleteThing(input: DeleteThingCommandInput) {
  const command = new DeleteThingCommand(input)
  const response: DeleteThingCommandOutput = await iotClient.send(command)
  return response
}

export async function addThingToThingGroup(input: AddThingToThingGroupCommandInput) {
  const command = new AddThingToThingGroupCommand(input)
  const response: AddThingToThingGroupCommandOutput = await iotClient.send(command)
  return response
}

export async function listThingPrincipals(input: ListThingPrincipalsCommandInput) {
  const command = new ListThingPrincipalsCommand(input)
  const response: ListThingPrincipalsCommandOutput = await iotClient.send(command)
  return response
}


export async function attachThingPrincipal(input: AttachThingPrincipalCommandInput) {
  const command = new AttachThingPrincipalCommand(input)
  const response: AttachThingPrincipalCommandOutput = await iotClient.send(command)
  return response
}

export async function detachThingPrincipal(input: DetachThingPrincipalCommandInput) {
  const command = new DetachThingPrincipalCommand(input)
  const response: DetachThingPrincipalCommandOutput = await iotClient.send(command)
  return response
}

export async function createKeysAndCertificate(input: CreateKeysAndCertificateCommandInput) {
  const command = new CreateKeysAndCertificateCommand(input)
  const response: CreateKeysAndCertificateCommandOutput = await iotClient.send(command)
  return response
}

export async function updateCertificate(input: UpdateCertificateCommandInput) {
  const command = new UpdateCertificateCommand(input)
  const response: UpdateCertificateCommandOutput = await iotClient.send(command)
  return response
}

export async function deleteCertificate(input: DeleteCertificateCommandInput) {
  const command = new DeleteCertificateCommand(input)
  const response: DeleteCertificateCommandOutput = await iotClient.send(command)
  return response
}

export async function listPrincipalThings(input: ListPrincipalThingsCommandInput) {
  const command = new ListPrincipalThingsCommand(input)
  const response: ListPrincipalThingsCommandOutput = await iotClient.send(command)
  return response
}

export async function listNamedShadowsForThing(input: ListNamedShadowsForThingCommandInput) {
  const command = new ListNamedShadowsForThingCommand(input)
  const response: ListNamedShadowsForThingCommandOutput = await iotDataClient.send(command)
  return response
}

export async function getThingShadow(input: GetThingShadowCommandInput) {
  const command = new GetThingShadowCommand(input)
  const response: GetThingShadowCommandOutput = await iotDataClient.send(command)
  return response
}

export async function publish(input: PublishCommandInput) {
  const command = new PublishCommand(input)
  const response: PublishCommandOutput = await iotDataClient.send(command)
  return response
}

export async function updateEventConfigurations(input: UpdateEventConfigurationsCommandInput) {
  const command = new UpdateEventConfigurationsCommand(input)
  const response: UpdateEventConfigurationsCommandOutput = await iotClient.send(command)
  return response
}

export async function updateIndexingConfiguration(input: UpdateIndexingConfigurationCommandInput) {
  const command = new UpdateIndexingConfigurationCommand(input)
  const response: UpdateIndexingConfigurationCommandOutput = await iotClient.send(command)
  return response
}

export async function createThingGroup(input: CreateThingGroupCommandInput) {
  const command = new CreateThingGroupCommand(input)
  const response: CreateThingGroupCommandOutput = await iotClient.send(command)
  return response
}

export async function attachPolicy(input: AttachPolicyCommandInput) {
  const command = new AttachPolicyCommand(input)
  const response: AttachPolicyCommandOutput = await iotClient.send(command)
  return response
}

export async function createThingType(input: CreateThingTypeCommandInput) {
  const command = new CreateThingTypeCommand(input)
  const response: CreateThingTypeCommandOutput = await iotClient.send(command)
  return response
}
