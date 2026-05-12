const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'main', 'resources', 'db', 'mongodb', 'init-hotel.js');
let content = fs.readFileSync(filePath, 'utf-8');

const avatars = [
  "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  "https://i.pravatar.cc/150?u=a04258114e29026702d",
  "https://i.pravatar.cc/150?u=a048581f4e29026701d",
  "https://i.pravatar.cc/150?u=a04258a2462d826712d"
];

const names = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", "Hoàng Văn E"];

let counter = 0;

// Only process the feedbacks block
const feedbacksStart = content.indexOf('upsertMany("feedbacks"');
const activityLogsStart = content.indexOf('upsertMany("activity_logs"');

if (feedbacksStart !== -1 && activityLogsStart !== -1) {
    const beforeFeedbacks = content.substring(0, feedbacksStart);
    let feedbacksBlock = content.substring(feedbacksStart, activityLogsStart);
    const afterFeedbacks = content.substring(activityLogsStart);

    feedbacksBlock = feedbacksBlock.replace(/user_id:\s*"([^"]+)",/g, (match, p1) => {
        const avatar = avatars[counter % avatars.length];
        const name = names[counter % names.length];
        counter++;
        return `${match}\n    customer_name: "${name}",\n    avatar_url: "${avatar}",`;
    });

    content = beforeFeedbacks + feedbacksBlock + afterFeedbacks;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Updated init-hotel.js successfully.");
} else {
    console.log("Could not find feedbacks block.");
}
