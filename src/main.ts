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

  const audience: string = core.getInput('audience')
  core.debug(`Provided audience: ${audience}`)

  let endpoint: string = core.getInput('endpoint')
  core.debug(`Provided endpoint: ${endpoint}`)

  // endpoint should end with /token
  if (!/\.*\/token$/gis.test(endpoint)) {
    endpoint = endpoint + '/token'
    core.debug(`Updated endpoint: ${endpoint}`)
  }

  core
    .getIDToken(audience)
    .then((token) => {
      const request: ScopedTokenRequest = {
        oidcToken: token,
        login
      }

      const rest: rc.RestClient = new rc.RestClient(
        'github-oidc-auth-action',
        endpoint
      )
      rest
        .create<ScopedTokenResponse>('', request)
        .then((res) => {
          if (res != null && res.statusCode === 200 && res.result != null) {
            if (res.result.scopedToken != null && res.result.scopedToken !== '') {
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
