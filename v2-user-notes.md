# v2 User Notes

First of all, USE [API v3][v3] if at all possible! It's [documented here][v3].

If you find yourself needing to use v2 for whatever reason, you can share notes
here. The main source of info for the [v2 API][v2] is [https://api-docs.heroku.com/](v2).

But there are a few undocumented corners of v2; that's where this file comes in.

If you see anything here that's wrong, or misleading, or missing, go ahead and
fix it! The edit button is right up there at the top.

Without further ado…

### custom domains

Move a custom domain to an app in another kernel with no downtime.

Pasted from [heroku/core#1869](https://github.com/heroku/core/issues/1869#issuecomment-15153192):

- `POST /apps/churrasco/domains/myapp.com` (don't love domain in the path, but that's a v2 convention of sorts)
- The only param taken by that endpoint so far is `app`, a pointer to the app to move the domain to (could be the app name or hid, similar to how `GET /apps/:id` works)
- Response is the regular serialization of the domain
- List and delete are unaffected from the client perspective


### attachable resources

Attachable resources docs at <https://github.com/heroku/api/blob/master/docs/api/attachable-resources.md>.


[v3]: https://github.com/heroku/api-doc
[v2]: https://api-docs.heroku.com/
