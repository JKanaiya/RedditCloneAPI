# Reddit Clone API

Reddit Clone API provides the backend API for this project: 
https://github.com/JKanaiya/RedditClone

## Usage

### Setup

1. Clone the repo
```bash
git clone https://github.com/JKanaiya/RedditCloneAPI
cd RedditCloneAPI
```
2. Install dependencies
```bash
pnpm i
```
3. Create and configure .env
```bash
echo "DATABASE_URL=<your_database_url>\nSECRET=<your_secret>\n">> .env

```
4. Run the development server
```bash
node --run dev
```

--------
## Features

- User authentication with JWT.
- Guest account creation to bypass login requirement.
- Error handling and validation.
- Update user's profile details: 
    - Profile Image
    - User Name
- Posts    
    - Create 
    - Editing 
    - Deleting Post Text and Title
- Comments    
    - Nested Comments
    - Editing Comments
    - Deleting Comment Text
- Follow Requests
    - Send follow request
    - Accept follow request
    - Deny follow request


## API Endpoints
### GET
|  Endpoint      |     Purpose   |
| ------------- | ------------- |
|   `/posts` | *attempts to obtain all posts*|
|   `/auth-check` | *checks if the users is authenticated*|
|   `/users` | *gets all users*|
|   `/accept-follow-request` | *accept a received follow request*|
|   `/reject-follow-request` | *reject a received follow request*|
|   `/subreddits` | *gets all subreddits, and their posts*|
|   `/user-posts` | *gets all posts from users that the logged in user is following*|


### POST
|  Endpoint      |     Purpose   |
| ------------- | ------------- |
|   `/log-in` | *attempts to login the user with their email and password*|
|   `/sign-up` | *attempts to register the user with a provided email and password*|
|   `/profile-image` | *sets the user's profile image*|
|   `/subreddit` | *creates a subreddit with a unique name*|
|   `/comment` | *creates a comment on a post*|
|   `/sub-post` | *creates a post on a specified subreddit*|
|   `/sub-comment` | *creates a comment on an existing comment*|
|   `/vote-post` | *votes on a post, either postive or negative*|
|   `/vote-comment` | *votes on a comment, either postive or negative*|
|   `/follow-request` | *creates a follow request by the logged in user to a specified user*|


### PATCH
|  Endpoint      |     Purpose   |
| ------------- | ------------- |
|   `/user` | *attempts to update a user's name*|
|   `/comment` | *attempts to update a comment's text*|
|   `/post` | *attempts to update a post's title and text*|
|   `/following` | *attempts to unfollow a followed user*|

### DELETE
|  Endpoint      |     Purpose   |
| ------------- | ------------- |
|   `/comment` | *attempts to delete a comment's text and title (replaces with "Comment was deleted")*|
|   `/post` | *attempts to delete a post's text and title (replaces with "Post was deleted")*|
|   `/vote` | *attempts to delete a vote from a comment or post*|


License
-------

The project is licensed under the BSD license.
