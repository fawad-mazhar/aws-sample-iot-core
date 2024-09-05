import { Aws, Duration, RemovalPolicy, Stack, StackProps, aws_s3objectlambda, CfnOutput} from 'aws-cdk-lib'
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal, ArnPrincipal, Policy, User, AnyPrincipal } from 'aws-cdk-lib/aws-iam'
import * as iot from 'aws-cdk-lib/aws-iot'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cf from 'aws-cdk-lib/aws-cloudformation'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { RestApi, LambdaIntegration, Cors, AuthorizationType} from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import * as path from 'path'


interface IotCoreStackProps extends StackProps {
  stage: string
  prefix: string
  coreLogLevel: string
  deviceThingType: string
  deviceThingGroup: string
  iotEndpoint: string
  deviceThingNamePrefix: string
  deviceThingNameSuffix: string
  awsIotSqlVersion: string
}

export class SampleIotCoreStack extends Stack {
  constructor(scope: Construct, id: string, props: IotCoreStackProps) {
    super(scope, id, props);

    // IoT Core Service Role
    const iotCoreServiceRole = this.createServiceRole(
      `${props.prefix}-core-service-role-${props.stage}`, 
      'iot.amazonaws.com', 
      [
        'service-role/AWSIoTThingsRegistration',
        'service-role/AWSIoTLogging',
        'service-role/AWSIoTRuleActions'
      ]
    )
    iotCoreServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["sts:AssumeRole"],
        resources: ["*"]
      })
    )
    iotCoreServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'iotsitewise:BatchPutAssetPropertyValue',
          'iotanalytics:BatchPutMessage',
          'iotevents:BatchPutMessage'
        ],
        resources: ["*"]
      })
    )
    
    /**
     * Enable Logging for AWS IoT Core
     */
    new iot.CfnLogging(this, `${props.prefix}-core-logger-${props.stage}`, {
      accountId: this.account,
      roleArn: iotCoreServiceRole.roleArn,
      defaultLogLevel: props.coreLogLevel
    })

    /**
     * IoT Policy for IoT device things group. 
     * This controls access for clients connecting with the "main thing name" as client id.
     */
    const iotPolicy = new iot.CfnPolicy(this, `${props.deviceThingNamePrefix}-${props.deviceThingNameSuffix}-policy`, {
      policyName: `${props.deviceThingNamePrefix}-${props.deviceThingNameSuffix}-policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement:[{
          Effect: 'Allow',
          Action: [
            'iot:Connect'
          ],
          Resource: [
            `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:client/$` + '{iot:Connection.Thing.ThingName}'
          ]
        }, {
          Effect: 'Allow',
          Action: [
            'iot:Publish',
            'iot:Receive'
          ],
          Resource: [
            `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/$aws/things/$` + '{iot:Connection.Thing.ThingName}/shadow/*',
            `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topic/zappy/api/$` + '{iot:Connection.Thing.ThingName}*'
          ] 
        }, {
          Effect: 'Allow',
          Action: [
            'iot:Subscribe',
          ],
          Resource: [
            `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topicfilter/$aws/things/$` + '{iot:Connection.Thing.ThingName}/shadow/*',
            `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topicfilter/$aws/things/$` + '{iot:Connection.Thing.ThingName}/tunnels/notify',
            `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:topicfilter/zappy/api/$` + '{iot:Connection.Thing.ThingName}*'
          ]
        }, {
          Effect: 'Allow',
          Action: [
            'iot:GetThingShadow',
            'iot:UpdateThingShadow',
            'iot:DeleteThingShadow',
            'iot:DescribeThing'
          ],
          Resource: [
            `arn:aws:iot:${Aws.REGION}:${Aws.ACCOUNT_ID}:/thing/$` + '{iot:Connection.Thing.ThingName}',
          ]
        }]
      }
    })

    /**
     * CFN Virgin Init λ Function
     * This λ function creates necessary resources for a virgin account/region
     * These resources are not yet supported by cloudformation 
     */
    new LogGroup(this, `${props.prefix}-virgin-init-log-grp-${props.stage}`, {
      logGroupName: `/aws/lambda/${props.prefix}-virgin-init-${props.stage}`,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const virginInitFn = new NodejsFunction(this, `${props.prefix}-virgin-init-${props.stage}`, {
      functionName: `${props.prefix}-virgin-init-${props.stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(300),
      memorySize: 512,
      handler: 'handler',
      environment: {
        IOT_DEVICE_THING_GROUP: props.deviceThingGroup,
        IOT_DEVICE_POLICY_NAME: `${props.deviceThingNamePrefix}-${props.deviceThingNameSuffix}-policy`,
        IOT_DEVICE_THING_TYPE: props.deviceThingType,
      },
      entry: path.join(__dirname, '/../functions/cfn/virgin-init.ts'),
    })
    virginInitFn.addToRolePolicy(new PolicyStatement({
      actions: [
        'iot:UpdateEventConfigurations',
        'iot:UpdateIndexingConfiguration',
        'iot:CreateThingGroup',
        'iot:AttachPolicy',
        'iot:CreateThingType'
      ],
      resources: ['*']
    }))

    /**
     * CFN Virgin Init λ Function Trigger
     */ 
    const virginInitFnTrigger = new cf.CfnCustomResource(this, `${props.prefix}-virgin-init-trigger-${props.stage}`, {
      serviceToken: virginInitFn.functionArn
    })
    virginInitFnTrigger.addDependency(iotPolicy)

    /**
     * S3 Bucket For Device IoT Auth Packages
     */
    const authenticationBucket = new s3.Bucket(this, `${props.prefix}-thing-auth-pkgs-${props.stage}`, {
      bucketName: `${props.prefix}-thing-auth-pkgs-${props.stage}`,
      cors: [{
        allowedMethods: [s3.HttpMethods.POST],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"]
      }],
      removalPolicy: RemovalPolicy.DESTROY,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      lifecycleRules: [{
        enabled: true,
        expiration: Duration.days(7)
      }],
    })
    
    new CfnOutput(this, `${props.prefix}-thing-auth-pkgs-${props.stage}-output`, {
      description: "S3 bucket that contains IoT Thing authentication packages.",
      value: `${props.prefix}-thing-auth-pkgs-${props.stage}`,      
    })

    /**
     * API GW λ Function
     * This λ Function is used to CREATE|DELETE IoT Things
     */
    new LogGroup(this, `${props.prefix}-http-request-log-grp--${props.stage}`, {
      logGroupName: `/aws/lambda/${props.prefix}-http-request-${props.stage}`,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const httpRequestLambdaFn = new NodejsFunction(this, `${props.prefix}-http-request-${props.stage}`, {
      functionName: `${props.prefix}-http-request-${props.stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(29),
      memorySize: 1024,
      handler: 'handler',
      environment: {
        IOT_DEVICE_THING_GROUP: props.deviceThingGroup,
        IOT_DEVICE_POLICY_NAME: `${props.deviceThingNamePrefix}-${props.deviceThingNameSuffix}-policy`,
        IOT_DEVICE_THING_TYPE: props.deviceThingType,
        IOT_DEVICE_THING_NAME_PREFIX: props.deviceThingNamePrefix,
        IOT_DEVICE_THING_NAME_SUFFIX: props.deviceThingNameSuffix,
        IOT_ENDPOINT: props.iotEndpoint,
        AUTH_PACKAGES_BUCKET: authenticationBucket.bucketName,
        STAGE: props.stage
      },
      entry: path.join(__dirname, '/../functions/http-api/request.ts'),
    })
    httpRequestLambdaFn.addToRolePolicy(new PolicyStatement({
      actions: [
        'iot:ListThings',
        'iot:DescribeThing',
        'iot:CreateThing',
        'iot:UpdateThing',
        'iot:DeleteThing',
        'iot:AddThingToThingGroup',
        'iot:ListThingPrincipals',
        'iot:ListPrincipalThings',
        'iot:CreateKeysAndCertificate',
        'iot:AttachThingPrincipal',
        'iot:DetachThingPrincipal',
        'iot:AttachPolicy',
        'iot:DetachPolicy',
        'iot:GetThingShadow',
        'iot:UpdateThingShadow',
        'iot:DeleteThingShadow',
        'iot:ListNamedShadowsForThing',
        'iot:UpdateCertificate',
        'iot:DeleteCertificate',
        'iot:DescribeEndpoint',
        'iot:Publish'
      ],
      resources: ['*']
    }))
    httpRequestLambdaFn.addToRolePolicy(new PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:HeadObject',
        's3:DeleteObject'
      ],
      resources: [
        `${authenticationBucket.bucketArn}/*`,
      ]
    }))
    httpRequestLambdaFn.addToRolePolicy(new PolicyStatement({
      actions: [
        's3:ListBucket'
      ],
      resources: [
        `${authenticationBucket.bucketArn}`,
      ]
    }))
    
    /**
     * API GW Defintion
     */
    const restApi = new RestApi(this, `${props.prefix}-core-api-${props.stage}`, {
      restApiName: `${props.prefix}-core-api-${props.stage}`,
      description: 'Sample IoT Core Http Api',
      deployOptions: {
        stageName: props.stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Auth-Token',
          'Cognito-Refresh-Token',
          'User-Agent',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true
      }
    })
    restApi.root.addMethod('GET', new LambdaIntegration(httpRequestLambdaFn), {
      authorizationType: AuthorizationType.NONE
    })
    const deviceApi = restApi.root.addResource('devices').addResource('{deviceSerial}')
    deviceApi.addMethod('GET', new LambdaIntegration(httpRequestLambdaFn))
    deviceApi.addMethod('PUT', new LambdaIntegration(httpRequestLambdaFn))
    deviceApi.addMethod('DELETE', new LambdaIntegration(httpRequestLambdaFn))

    /**
     * MQTT Request λ Function
     */
    new LogGroup(this, `${props.prefix}-mqtt-request-log-grp-${props.stage}`, {
      logGroupName: `/aws/lambda/${props.prefix}-mqtt-request-${props.stage}`,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const mqttRequestLambdaFn = new NodejsFunction(this, `${props.prefix}-mqtt-request-${props.stage}`, {
      functionName: `${props.prefix}-mqtt-request-${props.stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(300),
      memorySize: 1024,
      handler: 'handler',
      environment: {
        IOT_DEVICE_THING_TYPE: props.deviceThingType,
        IOT_DEVICE_THING_NAME_PREFIX: props.deviceThingNamePrefix,
        IOT_DEVICE_THING_NAME_SUFFIX: props.deviceThingNameSuffix,
        IOT_ENDPOINT: props.iotEndpoint,       
        STAGE: props.stage
      },
      entry: path.join(__dirname, '/../functions/mqtt-api/request.ts'),
    })
    mqttRequestLambdaFn.addToRolePolicy(new PolicyStatement({
      actions: [
        'iot:Publish',
        'iot:DescribeThing',
      ],
      resources: ['*']
    }))

    /**
     * IoT Rule
     * This rule invokes the MQTT Request λ Function
     */
    const requestTopicRule = new iot.CfnTopicRule(this, `${props.prefix}-device-request-rule-${props.stage}`, {
      ruleName: `iot_device_request_rule_${props.stage}`,
      topicRulePayload: {
        ruleDisabled: false,
        awsIotSqlVersion: props.awsIotSqlVersion,
        sql: "SELECT " +
             "topic() AS topic, " + 
             "clientid() AS clientId, " + 
             "principal() AS principal, " + 
             "* as message, " +
             "FROM 'zappy/api/+/request/#'",
        actions: [{
          lambda: {
            functionArn: mqttRequestLambdaFn.functionArn,
          },
        }],
      },
    })

    new CfnOutput(this, `${props.prefix}-device-request-rule-${props.stage}-output`, {
      description: `IoT topic rule to trigger on mqtt device request.`,
      value: `${requestTopicRule.ruleName}`,      
    })

    // λ Resource Policy allows invocation from IoT Rule
    mqttRequestLambdaFn.addPermission("LambdaInvokePermission", {
      principal: new ServicePrincipal('iot.amazonaws.com'),
      sourceArn: requestTopicRule.attrArn,
    })


    /**
     * IoT Shadow λ Function
     */
    new LogGroup(this, `${props.prefix}-mqtt-shadow-log-grp${props.stage}`, {
      logGroupName: `/aws/lambda/${props.prefix}-mqtt-shadow-${props.stage}`,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const deviceShadowLambdaFn = new NodejsFunction(this, `${props.prefix}-mqtt-shadow-${props.stage}`, {
      functionName: `${props.prefix}-mqtt-shadow-${props.stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      handler: 'handler',
      environment: {
        IOT_DEVICE_THING_TYPE: props.deviceThingType,
        IOT_DEVICE_THING_NAME_PREFIX: props.deviceThingNamePrefix,
        IOT_DEVICE_THING_NAME_SUFFIX: props.deviceThingNameSuffix,
        STAGE: props.stage
      },
      entry: path.join(__dirname, '/../functions/mqtt-api/shadow.ts'),
    })

    /**
     * IoT Rule
     * This rule invokes the MQTT Shadow λ Function
     */
    const deviceShadowTopicRule = new iot.CfnTopicRule(this, `${props.prefix}-device-shadow-rule-${props.stage}`, {
      ruleName: `iot_device_shadow_rule_${props.stage}`,
      topicRulePayload: {
        ruleDisabled: false,
        awsIotSqlVersion: props.awsIotSqlVersion,
        sql: "SELECT " + 
             "topic(3) AS thingName, " + 
             "topic(6) AS shadowName, " +
             "previous.state.reported as previousState, " + 
             "current.state.reported as currentState, " + 
             "FROM '$aws/things/+/shadow/name/+/update/documents' ",
        actions: [{
          lambda: {
            functionArn: deviceShadowLambdaFn.functionArn,
          },
        }],
      },
    })

    new CfnOutput(this, `${props.prefix}-device-shadow-rule-${props.stage}-output`, {
      description: `IoT topic rule to trigger on device shadow updates.`,
      value: `${deviceShadowTopicRule.ruleName}`,
    })

    // λ Resource Policy allows invocation from IoT Rule
    deviceShadowLambdaFn.addPermission("LambdaInvokePermission", {
      principal: new ServicePrincipal('iot.amazonaws.com'),
      sourceArn: deviceShadowTopicRule.attrArn,
    })

    /**
     * MQTT Last Will λ Function
     */
    new LogGroup(this, `${props.prefix}-mqtt-last-will-log-grp-${props.stage}`, {
      logGroupName: `/aws/lambda/${props.prefix}-mqtt-last-will-${props.stage}`,
      retention: RetentionDays.ONE_YEAR,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const mqttLastWillLambdaFn = new NodejsFunction(this, `${props.prefix}-mqtt-last-will-${props.stage}`, {
      functionName: `${props.prefix}-mqtt-last-will-${props.stage}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      handler: 'handler',
      environment: {
        IOT_DEVICE_THING_TYPE: props.deviceThingType,
        IOT_DEVICE_THING_NAME_PREFIX: props.deviceThingNamePrefix,
        IOT_DEVICE_THING_NAME_SUFFIX: props.deviceThingNameSuffix,
        STAGE: props.stage
      },
      entry: path.join(__dirname, '/../functions/mqtt-api/last-will.ts'),
    })
      

    /**
     * IoT Rule
     * This rule invokes the MQTT Last Will λ Function
     */
    const lastWillTopicRule = new iot.CfnTopicRule(this, `${props.prefix}-device-last-will-${props.stage}`, {
      ruleName: `iot_device_last_will_rule_${props.stage}`,
      topicRulePayload: {
        ruleDisabled: false,
        awsIotSqlVersion: props.awsIotSqlVersion,
        sql: "SELECT " +
             "topic() AS topic, " + 
             "clientid() AS clientId, " + 
             "principal() AS principal, " + 
             "* as message, " +
             "FROM 'zappy/api/+/lastWill'",
        actions: [{
          lambda: {
            functionArn: mqttLastWillLambdaFn.functionArn,
          },
        }],
      },
    })

    new CfnOutput(this, `${props.prefix}-device-last-will-${props.stage}-output`, {
      description: `IoT topic rule to trigger on device's last will.`,
      value: `${lastWillTopicRule.ruleName}`,      
    })

    // λ Resource Policy allows invocation from IoT Rule
    mqttLastWillLambdaFn.addPermission("LambdaInvokePermission", {
      principal: new ServicePrincipal('iot.amazonaws.com'),
      sourceArn: lastWillTopicRule.attrArn,
    })


  }

  // IAM Roles for Services
  private createServiceRole(identifier: string, servicePrincipal: string, policyNames: string[]) {
    return new Role(this, identifier, {
      roleName: identifier,
      assumedBy: new ServicePrincipal(servicePrincipal),
      managedPolicies: policyNames.map(policyName => ManagedPolicy.fromAwsManagedPolicyName(policyName))
    });
  }
}
