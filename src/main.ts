import * as core from '@actions/core'
import * as rc from 'typed-rest-client/RestClient'

interface ScopedTokenRequest {
  oidcToken: string
  login: string
}

interface ScopedTokenResponse {
  scopedToken: string
  installationId: number
  message: string
}

async function run (): Promise<void> {
  const login = core.getInput('login')
  core.debug(`Provided login: ${login}`)

  let endpoint: string = core.getInput('endpoint')
  core.debug(`Provided endpoint: ${endpoint}`)

  // endpoint should end with /token
  if (!/\.*\/token$/gis.test(endpoint)) {
    endpoint = endpoint + '/token'
    core.debug(`Updated endpoint: ${endpoint}`)
  }

  core
    .getIDToken()
    .then((token) => {
      core.debug(`ID Token: ${token}`)
      const request: ScopedTokenRequest = {
        oidcToken: token,
        login
      }

      // log the current time
      const now = new Date()
      console.log(`Current time: ${now.toISOString()}`)

      const rest: rc.RestClient = new rc.RestClient(
        'github-oidc-auth-action',
        endpoint
      )
      rest
        .create<ScopedTokenResponse>('', request)
        .then((res) => {
          if (res != null && res.statusCode === 200 && res.result != null) {
            if (res.result.scopedToken != null) {
              core.setOutput('scopedToken', res.result.scopedToken)
              // set scoped token as an env variable
              core.exportVariable('SCOPED_TOKEN', res.result.scopedToken)
            } else {
              core.setFailed(
                `Failed to get scoped token: ${res.result.message}`
              )
            }
          } else {
            core.setFailed(`Failed to get scoped token: ${res.statusCode}`)
          }
        })
        .catch((error) => {
          console.log(error)
          core.setFailed(error.message)
        })
    })
    .catch((error) => {
      console.log(error)
      core.setFailed(error.message)
    })
}

void run()
