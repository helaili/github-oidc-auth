# github-oidc-auth

This is the companion action for the [`github-oidc-auth-app`](https://github.com/helaili/github-oidc-auth-app) GitHub App. This action will connect to an instance of this app and retrieve a scoped token that can be used to access GitHub resources belonging to an organisation or user that installed the app. This means you can access to 3rd party ressources on GitHub with no secret and no Personal Access Token. Yes, you read it right, no PAT!!!!

The action needs two inputs:
- `endpoint`: this is the URL of the `/token` endpoint of the app you deployed above. It should look like `https://my-app.com/token`.
- `login`: this is the login name of the organisation or user that will be accessed with the scoped token. The app should have been installed on this account.


```yaml
should-work-with-action:
    ...
    permissions:
      id-token: write
    steps:
      - name: GetToken
        id: getToken
        uses: helaili/github-oidc-auth@main
        with:
          login: ${{ vars.login }}
          endpoint: ${{ vars.endpoint }}
      - name: Use the token from the environment
        uses: actions/github-script@v6
        with:
          github-token: ${{ env.SCOPED_TOKEN }}
        ...   
      - name: Use the token from the step output
        uses: actions/github-script@v6
        with:
          github-token: ${{ steps.getToken.outputs.scopedToken }}

        ...
```

# Giving it a try

You might want to give this app and action a try without going through the hassle of creating a new GitHub app and deploying it somewhere. Make sense, so I created a sandbox for you. This is a sandbox, there is no SLA coming with this and as I am running it, it really means that you are trusting me with your GitHub token. I am not going to do anything bad with it, but you should not use this for anything serious. In order to limit any problem,  no organisation permission are granted to this app instance. The only repository permissions granted are:
- administration: `read`
- contents: `write`
- issues: `write`

In order to use this sandbox, you will need to:
- Create a file named `oidc_entitlements.json` in the `.github-private` repository of your organisation. See [the app's README file](https://github.com/helaili/github-oidc-auth-app/blob/main/README.md) for details about the syntax of this file.
- Install the app on your organisation by clicking [here](https://github.com/apps/oidc-auth-for-github-sandbox). Make sure you grant the app access to at least the `.github-private` repository and whichever other one within this organisation that you will want to access using the token. 
- Create a workflow that uses the action `helaili/github-oidc-auth` as shown below. 

```yaml
name: Test GitHub OIDC Auth sandbox

on:
  workflow_dispatch:
   
jobs:
  sandbox-test:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest
    permissions:
      id-token: write #Important. We need this to get the OIDC token from Actions
      
    steps:
      - name: Get the token
        id: getToken
        uses: helaili/github-oidc-auth@main
        with:
          login: < organisation or user login which you need access to >
          endpoint: https://oidc-auth-app-sandbox.whitefield-370b64fc.eastus.azurecontainerapps.io/token

      - name: Use the token from the output
        uses: actions/github-script@v6
        with:
          github-token: ${{ steps.getToken.outputs.scopedToken }}
          script: |
            github.rest.repos.get({
              owner: 'my-org',
              repo: 'my-repo'
            }).then((response) => {
              if(!response.data.full_name === 'my-org/my-repo') {
                // Victory!
              }
            }).catch((error) => {
              core.setFailed(`Failed to access repo. Error was ${error}`);
            })
```
