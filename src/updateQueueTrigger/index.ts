import { APIGatewayProxyEvent, Context } from 'aws-lambda'
import Lambda from 'aws-sdk/clients/lambda'
import { getPaginatedResults } from '../utils/getPaginatedResults'

const lambda = new Lambda()

/**
 * Handler function.
 * 
 * @param event 
 * @param context 
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  console.log(JSON.stringify(event, undefined, 2))

  context.callbackWaitsForEmptyEventLoop = false

  if (!event.body) {
    return {
      statusCode: 400,
      body: 'No event',
    }
  }
  return getFunctionsList(event)
}

/**
 * Get the list of functions belonging to the account
 *
 * @param event
 */
const getFunctionsList = async (event: APIGatewayProxyEvent) => {
  console.log('Getting functions list...')

  if (!event.body) {
    return {
      statusCode: 400,
      body: 'No event',
    }
  }

  try {
    const lambdas = await getPaginatedResults(async (NextMarker: string) => {
      const functions = await lambda.listFunctions({ Marker: NextMarker }).promise()

      return {
        marker: functions.NextMarker,
        results: functions.Functions,
      }
    })

    console.log(`NUMBER OF FUNCTIONS RETURNED IS ${lambdas.length}`)
    const functionNames = lambdas.map((name) => name.FunctionName)

    return getEventSourceMappings(event, functionNames)
  } catch (error) {
    console.log(error)
    throw error
  }
}

/**
 * Get the Event source mappings for functions that have them
 *
 * @param event
 * @param functionNames
 */
const getEventSourceMappings = async (event: APIGatewayProxyEvent, functionNames: string[]) => {
  console.log('Getting event source mappings...')

  let eventSourceList = []

  try {
    for (let i = 0; i < functionNames.length; i++) {
      const name = functionNames[i]
      const request = await lambda
        .listEventSourceMappings({ FunctionName: name, MaxItems: functionNames.length })
        .promise()

      const eventSourceMappings = request.EventSourceMappings

      if (eventSourceMappings === undefined) {
        return {
          statusCode: 400,
          body: 'No event source mappings found',
        }
      }

      // get mappings from array
      const events = eventSourceMappings[0]

      if (events !== undefined) {
        eventSourceList.push(events)
      }
    }
  } catch (error) {
    console.log(error)
    throw error
  }
  return updateEventSourceState(event, eventSourceList)
}

/**
 * Update the event source mapping state to enabled/disabled
 *
 * @param event
 * @param eventSourceList
 */
const updateEventSourceState = async (event: APIGatewayProxyEvent, eventSourceList: any) => {
  console.log('Updating event source state')

  console.log('EVENT SOURCE LIST: ', eventSourceList)

  // @ts-ignore
  const state: boolean = event.body.state
  let currentState: string

  if (state === true) {
    currentState = 'Enabled'
  } else {
    currentState = 'Disabled'
  }

  // extract the uuids
  let uuids: any = []
  eventSourceList.forEach((uuid: any) => {
    // if currentState and intended state don't match, put in array
    if (eventSourceList[0].State != currentState) {
      uuids.push(uuid.UUID)
    }
  })

  let updatedList = []

  try {
    for (let i = 0; i < uuids.length; i++) {
      const uuid = uuids[i]
      const result = await lambda.updateEventSourceMapping({ UUID: uuid, Enabled: state }).promise()
      console.log(`FunctionArn ${result.FunctionArn} is ${result.State}`)
      updatedList.push(result)
    }
  } catch (error) {
    console.log(error)
    throw error
  }
  if (updatedList.length > 0) {
    console.log('UPDATED LIST: ', updatedList)
  } else {
    console.log('NO CHANGES MADE')
  }
}
