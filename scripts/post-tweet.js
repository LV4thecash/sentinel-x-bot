const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const TWEETS_PATH = path.join(__dirname, '..', 'data', 'tweets.json');
const STATE_PATH = path.join(__dirname, '..', 'data', 'state.json');

async function main() {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });

  const tweets = JSON.parse(fs.readFileSync(TWEETS_PATH, 'utf-8'));
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));

  let index = state.index % tweets.length;
  const tweet = tweets[index];

  console.log(`Posting tweet #${index}: "${tweet.substring(0, 50)}..."`);

  try {
    const result = await client.v2.tweet(tweet);
    console.log(`Tweet posted successfully. ID: ${result.data.id}`);
  } catch (error) {
    // X API duplicate tweet error code is 187
    if (error.code === 187 || error.data?.errors?.[0]?.code === 187) {
      console.log(`Tweet #${index} already posted (duplicate). Skipping to next.`);
      // Fall through to increment index past the duplicate
    } else {
      console.error(`Failed to post tweet: ${error.message}`);
      process.exit(1); // Exit without incrementing — retries same tweet next run
    }
  }

  // Increment and save state
  state.index = (index + 1) % tweets.length;
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
  console.log(`State updated. Next index: ${state.index}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
