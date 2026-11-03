const form = document.querySelector('#chat-form');
const input = document.querySelector('#message-input');
const messages = document.querySelector('#messages');
const sendButton = document.querySelector('#send-button');
const intro = document.querySelector('#intro');

const history = [];

function addMessage(role, text) {
  const item = document.createElement('article');
  item.className = `message message-${role}`;
  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'YOU' : 'AUDIO DESIGN ASSISTANT';
  const body = document.createElement('p');
  body.textContent = text;
  item.append(label, body);
  messages.append(item);
  item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return item;
}

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

input.addEventListener('input', resizeInput);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll('.suggestion').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.textContent;
    form.requestSubmit();
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || sendButton.disabled) return;

  intro.hidden = true;
  addMessage('user', text);
  history.push({ role: 'user', content: text });
  input.value = '';
  resizeInput();
  sendButton.disabled = true;
  const pending = addMessage('assistant', 'Thinking…');
  pending.classList.add('message-pending');

  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The assistant could not respond. Please try again.');
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The assistant returned an empty reply. Please try again.');
    pending.querySelector('p').textContent = data.reply;
    pending.classList.remove('message-pending');
    history.push({ role: 'assistant', content: data.reply });
  } catch (error) {
    pending.remove();
    const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    addMessage('assistant', message);
    history.pop();
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
});
