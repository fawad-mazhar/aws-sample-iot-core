# Sample IoT Core
---

Fawad Mazhar <fawadmazhar@hotmail.com> 2024

---

A sample solution that demonstrates how to build and manage a robust IoT solution using AWS cloud-native technologies. It covers key IoT concepts such as secure device provisioning, IoT policies, MQTT messaging, and IoT Shadows while leveraging serverless components to create a scalable, secure, and easily manageable infrastructure.


## Project Overview
This project is an excellent starting point for anyone who wants to learn about building IoT solutions on AWS. It simplifies complex tools and concepts, such as IoT device provisioning, secure communication, and serverless architecture. By combining these capabilities, you can understand the full power of AWS IoT services and how to leverage them for scalable and secure IoT deployments.

It is designed to make it easier to get started with AWS IoT. By binding together various serverless AWS services and focusing on security, scalability, and flexibility, you’ll get a deep understanding of the power of IoT on the cloud and how to build robust IoT applications using AWS.

#### Key Features
- <b>AWS IoT Core Integration:</b> Seamlessly connect IoT devices to the cloud using AWS IoT Core, providing secure and scalable communication.

- <b>Automated IoT Device Provisioning:</b> Automate the process of provisioning IoT devices with x.509 certificates, ensuring secure device identification and communication.

- <b>IoT Shadows:</b> Utilize AWS IoT Shadows to store and retrieve the current state of devices, enabling control and updates even when devices are offline.

- <b>Python-based MQTT Client:</b> A sample Python-based MQTT client is provided for experimenting with MQTT messaging. It allows you to interact with your IoT devices using MQTT APIs, supporting operations like publishing and subscribing to messages.

- <b>Serverless Components:</b>
  - <b>AWS Lambda:</b> Handle backend logic and event processing without managing servers.
  - <b>AWS IoT Rules Engine:</b> Process and filter incoming IoT messages, route them to other AWS services (like Lambda), and automate workflows.
  -  <b>Amazon API Gateway:</b> Create, update, and delete your IoT Things using simple <code>curl</code> commands through RESTful API endpoints exposed via API Gateway.

- <b>Scalable MQTT API:</b> Securely scale your MQTT APIs in the cloud, ensuring that the system grows with your needs without compromising security or performance.

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