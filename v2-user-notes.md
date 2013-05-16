# v2 User Notes

First of all, USE [API v3][v3] if at all possible! It's [documented here][v3].

If you find yourself needing to use v2 for whatever reason, you can share notes
here. The main source of info for the [v2 API][v2] is [https://api-docs.heroku.com/](v2).

But there are a few undocumented corners of v2; that's where this file comes in.

If you see anything here that's wrong, or misleading, or missing, go ahead and
fix it! The edit button is right up there at the top.

Without further ado…

### Custom Domains

Move a custom domain to an app in another kernel with no downtime.

Pasted from [heroku/core#1869](https://github.com/heroku/core/issues/1869#issuecomment-15153192):

- `POST /apps/churrasco/domains/myapp.com` (don't love domain in the path, but that's a v2 convention of sorts)
- The only param taken by that endpoint so far is `app`, a pointer to the app to move the domain to (could be the app name or hid, similar to how `GET /apps/:id` works)
- Response is the regular serialization of the domain
- List and delete are unaffected from the client perspective


### Attachable Resources

Attachable resources docs at <https://github.com/heroku/api/blob/master/docs/api/attachable-resources.md>.


[v3]: https://devcenter.heroku.com/articles/platform-api-reference?preview=1
[v2]: https://api-docs.heroku.com/

### Labs Features

Getting the features for an app

Request:

    GET /features[/feature][?app=]

Response Model (could be scalar or array depending on request):

    Feature(kind: String, name: String, enabled: Boolean, docs: String, summary: String)

### Sticky Releases and Manual Deploys

These features to control process releases use undocumented params to process requests:

- `POST /apps/:app/ps/restart` takes a `:release` param
- `POST /apps/:app/ps/scale` takes a `:release` param
- `POST /apps/:app/ps` takes a `:release` param

These requests restart, scale, and run processes on the specified release.

### Other Undocumented APIs

Below are links to code in apps using undocumented APIs:
 - https://github.com/heroku/tesuto/blob/master/app/com/heroku/api/HerokuApiSupplements.scala
 - https://github.com/heroku/cisaurus/blob/master/app/com/heroku/api/Requests.scala
