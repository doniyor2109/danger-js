// import * as debug from "debug"
import { PlatformCommunicator } from "../../platform"
import { GitHubAPI } from "../GitHubAPI"
import { DangerResults } from "../../../dsl/DangerResults"
import { ExecutorOptions } from "../../../runner/Executor"
import { resultsToCheck } from "./checks/resultsToCheck"
import { getAccessTokenForInstallation } from "./checks/githubAppSupport"

// See https://github.com/auth0/node-jsonwebtoken/issues/162
const JWT_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/

// const d = debug("danger:GitHub::Checks")

export const getAuthWhenUsingDangerJSApp = () => {
  const appID = "12316"
  const key =
    "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEA00hv5YqXgqv2A60eo7+fQtwRYjN5BYu3Xgm0L3s5FZdup7pF\nL0oHruUwsDi6Z6MKgyKgnKBZKUXoUgqrMdhbka9rLfGtGp35SBjp+xgXNUKuwwks\ng0tIoLkPzDF2OiG3UB+vPWOBRqdMtA5dZTPZkz5xfBWivJBacVqcuf6j0nwRgv9q\npypIPWnmNZ2/y6jQfXnRubi7k72XSpazTmYx+2EoeMwkpGV+jPy/vd8ODr/n+5wI\nLAQd+24VEn7ixTW8WU9RUVA2a+kCoyGMpp+Zof9YdJmGE9cn23EAr8usDXvWG/3h\nRJ8tSqV/EyLgMRDk+ACMBu7WU4gKXXqkmjCbQwIDAQABAoIBAEDTXOHE4C/LqzP9\njgUX6jmNZBgJSvyUnbJQr+RRnnYtfFoiINAdmrXixEmNXkQmFjeeDEGCQVkUhe+G\nLnigtZfBhtUV7dLY3X9thXzxK03AI/bbfbjbBHGr1lkEZA36AlCnKBFh0mxnMHWe\nYrGGcx9mbVNxH/lTISzebG/03TbbI5y5tcaINoLs//M4KTS/boEBHBG+nTiKpMo+\n39P+LRui9mNYyCYxZJDgrpUOIvyyHhNYPHTlOamzesgIsD59/OIxmMT0xu9EZuZe\nY4mbnU1tgBmZNFSDih/R6m3TsFB6PA2hjkHbiHVa6q/+Nshq9P/2pZJzz2R0aMJT\njLoTlqECgYEA6bwIU0xKIMzvaZuEkkaIn4vT0uPr6bSZz1LXQWXkOV76SBL36z8T\np7Q5yOBy1cd6m6fevaOHg2o16XVyIJtUOrSI4WzGaKvcjbL0jpwHJSrS79XY4YmS\neZrVZkyNwmCUY9NG3Y3F1yJQwO0BeUw9Dllr23p/4rhnIEjovL1XN3cCgYEA52jj\nz0sDOmT5wzttZwC2bfJQu7sHwNKQIfDgkht1RtwOpg8qSzuKouzcbwacpiN006rK\nr9wIg1vv89tWfout7WYODQPJXAi6ImeHDe4WnCx7Uq7UBUaXMk8e9gFJPec7UCp+\n8o9b+wqZSYtoqV5P+bh0iVKDmojmYtbyXqZoBZUCgYB3IyXnN4KtV2hNHz0ixhsL\nn903qH9uX2Tq/WHE7ue2qofORwThfwRIvh+aGXXPK99+CcIKTZlcTb3vIrMqlaII\nTk9a//PeFIPWIjpvmm417q8YGpty0om7vEU74Jd9VXctrtp3QbVvJAmfXO8cYdTZ\nRJEqjTU0XiQKm78tvSEAnwKBgDeDmDMggbO+iZRma0Zsi1cw7GE86w089krOKHGk\nmKvZGsKHnNPTgty3CeKwqV/J3brxnBI4LOqmYZgUpFlTVPRAqVpB8Epd5ZlfUKzs\n0wvAOA2L1100pAzzoi/N+y4YjMgcibvS3HQLBN75zK/k6ja0I3DWFLA761kGy7od\nHZNJAoGAAifMxN9QvRzbkyeqoXvKjZB7CLQdiBIMw7/sZSY6gZWrdDkaKwRIgWdD\nfJP+6fi4oAGuOOiB1oHPMgu4WS6Bb1GnJUgEV0iIGTJImEUTzMlkek189JjXMnL2\nOzjqWcWNngSrmpPu6fHuQswzluYuJgU+RnC1vS/y0J00wE4aZgs=\n-----END RSA PRIVATE KEY-----\n"
  const installID = process.env.DANGER_JS_APP_INSTALL_ID

  return {
    appID,
    key,
    installID,
  }
}

export const getCustomAppAuthFromEnv = () => {
  const appID = process.env.DANGER_GITHUB_APP_ID || process.env.PERIL_INTEGRATION_ID
  const key = process.env.DANGER_GITHUB_APP_PRIVATE_SIGNING_KEY || process.env.PRIVATE_GITHUB_SIGNING_KEY
  const installID = process.env.DANGER_GITHUB_APP_INSTALL_ID || process.env.PERIL_ORG_INSTALLATION_ID

  return {
    appID,
    key,
    installID,
  }
}

const canUseChecks = (token: string | undefined) => {
  // Is it a JWT from Peril, basically?
  if (token && token.match(JWT_REGEX)) {
    return true
  }
  // Are you using a custom GH app manually?
  const custom = getCustomAppAuthFromEnv()
  if (custom.appID && custom.key && custom.installID) {
    return true
  }
  // Are you using the Danger JS app?
  const dangerApp = getAuthWhenUsingDangerJSApp()
  if (dangerApp.appID && dangerApp.key && dangerApp.installID) {
    return true
  }

  return false
}

/**
 * An object whose responsibility is to handle commenting on an issue
 * @param api
 */
export const GitHubChecksCommenter = (api: GitHubAPI): PlatformCommunicator | undefined => {
  if (!canUseChecks(api.token)) {
    return undefined
  }

  return {
    supportsCommenting: () => true,
    supportsInlineComments: () => true,
    supportsHandlingResultsManually: () => true,

    handlePostingResults: async (results: DangerResults, options: ExecutorOptions) => {
      console.log("Using Checks")
      const pr = await api.getPullRequestInfo()

      let octokit
      if (options.accessTokenIsGitHubApp) {
        octokit = api.getExternalAPI()
      } else {
        const custom = process.env.DANGER_JS_APP_INSTALL_ID ? getAuthWhenUsingDangerJSApp() : getCustomAppAuthFromEnv()
        const generatedJWT = await getAccessTokenForInstallation(
          custom.appID!,
          parseInt(custom.installID!),
          custom.key!
        )
        octokit = api.getExternalAPI(generatedJWT)
      }

      if (!octokit) {
        console.error("No octokit generated for the checks commentor")
        return
      }

      const checkData = resultsToCheck(results, options, pr)
      await octokit.checks.create(checkData)
      // const existingReport = octokit.issues
    },

    // These are all NOOPs, because they aren't actually going to be called
    updateStatus: () => Promise.resolve(true),
    getInlineComments: () => Promise.resolve([]),
    createComment: () => Promise.resolve({}),
    createInlineComment: () => Promise.resolve({}),
    updateInlineComment: () => Promise.resolve({}),
    deleteMainComment: () => Promise.resolve(true),
    deleteInlineComment: () => Promise.resolve(true),
    updateOrCreateComment: () => Promise.resolve("NOOP"),
  }
}
