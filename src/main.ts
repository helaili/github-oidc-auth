import * as core from '@actions/core'
import * as rc from 'typed-rest-client/RestClient'

interface ScopedTokenRequest {
  oidcToken: string
  installationId: number
}

interface ScopedTokenResponse {
  scopedToken: string
  installationId: number
  message: string
}

async function run (): Promise<void> {
  const installationId = parseInt(core.getInput('installationId'))
  core.debug(`Provided installationId: ${installationId}`)

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
        installationId
      }

      const rest: rc.RestClient = new rc.RestClient(
        'github-oidc-auth-action',
        endpoint
      )
      rest
        .create<ScopedTokenResponse>('', request)
        .then((res) => {
          console.log(res)
          if (res != null && res.statusCode === 200 && res.result != null) {
            if (res.result.scopedToken != null) {
              core.setOutput('scopedToken', res.result.scopedToken)
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
