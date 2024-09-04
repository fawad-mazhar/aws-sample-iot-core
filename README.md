# Sample IoT Core
---

Fawad Mazhar <fawadmazhar@hotmail.com> 2024

---


## Pre-requisites
  - 🔧 AWS CLI Installed & Configured 👉 [Get help here](https://aws.amazon.com/cli/)
  - 🔧 Node.js 18.x+
  - 🔧 AWS CDK 👉 [Get help here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) 


## Configuring AWS CLI
```bash
  ~/.aws/credentials

  [profile_name]
  aws_access_key_id = XXXXX
  aws_secret_access_key = XXXXX
```

```bash
  ~/.aws/config

  [profile profile_name]
  region = eu-west-1
```


## Installation
Run command:
```bash
  npm install
  npm run bootstrap:dev
```


## Deploying to dev (eu-west-1)
Run command:
```bash
  npm run deploy:dev
```

## Checking differences between local and deployed version
Run command:
```bash
  npm run diff:dev
```

## Checking synthesized CloudFormation template
Run command:
```bash
  npm run synth:dev
```