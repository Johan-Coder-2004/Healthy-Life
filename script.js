const socket = io('http://localhost:3000'); // Connect to the server

const messageContainer = document.getElementById('message-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const onlineUsersList = document.querySelector('.chat-list'); // Container for online users

// Retrieve the username from localStorage
const currentUsername = localStorage.getItem('username');
if (!currentUsername) {
  alert('You must be logged in to access the chat.');
  window.location.href = '../login.html'; // Redirect to login if no username is found
}

// Notify the server that this user has joined (only after login)
socket.emit('userJoined', currentUsername);

// Function to add a message to the chat
function addMessage(username, message, isCurrentUser) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.classList.add(isCurrentUser ? 'sent' : 'received'); // Add 'sent' or 'received' class

  const senderName = document.createElement('div');
  senderName.classList.add('sender-name');
  senderName.textContent = username;

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  bubble.textContent = message;

  const timestamp = document.createElement('span');
  timestamp.classList.add('timestamp');
  timestamp.textContent = new Date().toLocaleTimeString();

  messageElement.appendChild(senderName);
  messageElement.appendChild(bubble);
  bubble.appendChild(timestamp);
  messageContainer.appendChild(messageElement);

  // Scroll to the bottom of the chat
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Function to update the list of online users
function updateOnlineUsers(users) {
  onlineUsersList.innerHTML = `
    <div class="section-header"><b>ONLINE</b></div>
    <br>
  `;

  users.forEach((user) => {
    const userElement = document.createElement('div');
    userElement.classList.add('chat-item');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerHTML = '<i class="fas fa-user"></i>';

    const userInfo = document.createElement('div');
    userInfo.classList.add('chat-info');
    userInfo.innerHTML = `
      <h3>${user} <span class="active-dot"></span></h3>
    `;

    userElement.appendChild(avatar);
    userElement.appendChild(userInfo);
    onlineUsersList.appendChild(userElement);
  });
}

// Send message on button click
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('sendMessage', { username: currentUsername, message }); // Send username and message to the server
    messageInput.value = ''; // Clear input field
  }
});

// Send message on pressing Enter
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});

// Listen for new messages from the server
socket.on('newMessage', (data) => {
  const { username, message } = data;
  const isCurrentUser = username === currentUsername; // Check if the message is from the current user
  addMessage(username, message, isCurrentUser); // Display the message
});

// Listen for updates to the list of online users
socket.on('updateOnlineUsers', (users) => {
  updateOnlineUsers(users); // Update the list of online users
});

// Load previous messages from the server
socket.on('loadMessages', (messages) => {
  messages.forEach((msg) => {
    const isCurrentUser = msg.username === currentUsername; // Check if the message is from the current user
    addMessage(msg.username, msg.message, isCurrentUser); // Display the message
  });
});