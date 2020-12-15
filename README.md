# Update-Queue-Trigger
Utilitiy AWS Lambda function to enable or disable all queues in an account. 

## Description
When developing in AWS using Lambda queue triggers, the Lambda's are constantly polling the queues, even when set to long-polling, which initiates every 20 seconds. Despite the high quota limits, when building a distributed system it is easy to go over the limit and start incurring unneccesary costs. 

This utility allows the developer or administrator to quickly enable or disable all queues in an account. It can be triggered manually, through an API or Cloudwatch event, or anyway that a Lambda can be triggered.

## Usage
Simply hit the Lamda with an event body that has a state: enabled or state: disabled. Done.

`{ "body":{ "state": false } }`

`{ "body":{ "state": true } }`


