import React from 'react';

const todos = [
  {
    id: 1,
    text: 'Lorem Ipsum is simply dummy text of the printing',
    date: '24 June 2020',
    status: 'due',
    badge: 'Due tomorrow',
    badgeClass: 'badge-warning',
    flag: true
  },
  {
    id: 2,
    text: 'Lorem Ipsum is simply dummy text of the printing',
    date: '23 June 2020',
    status: 'done',
    badge: 'Done',
    badgeClass: 'badge-done',
    flag: false
  },
  {
    id: 3,
    text: 'Lorem Ipsum is simply dummy text of the printing',
    date: '24 June 2020',
    status: 'done',
    badge: 'Done',
    badgeClass: 'badge-done',
    flag: false
  },
  {
    id: 4,
    text: 'Lorem Ipsum is simply dummy text of the printing',
    date: '24 June 2020',
    status: 'expired',
    badge: 'Expired',
    badgeClass: 'badge-expired',
    flag: false
  }
];

const TodoList = () => (
  <div className="todo-list-card">
    <div className="todo-list-header">
      <span className="todo-list-title">Todo List</span>
      <button className="todo-list-add-btn" title="Add Todo">
        <span style={{fontSize: '1.5em', fontWeight: 'bold', color: '#2563eb'}}>+</span>
      </button>
    </div>
    <div className="todo-list-items">
      {todos.map((todo, idx) => (
        <div className="todo-list-item" key={todo.id}>
          <div className="todo-list-item-row">
            <input type="checkbox" disabled className="todo-list-checkbox" />
            <span className="todo-list-text">{todo.text}</span>
            {todo.flag && <span className="todo-list-flag" title="Flagged" style={{marginLeft: 8, color: '#f59e0b'}}>&#9873;</span>}
          </div>
          <div className="todo-list-item-meta">
            <span className="todo-list-date">{todo.date}</span>
            <span className={`todo-list-badge ${todo.badgeClass}`}>{todo.badge}</span>
          </div>
          {idx !== todos.length - 1 && <hr className="todo-list-divider" />}
        </div>
      ))}
    </div>
  </div>
);

export default TodoList; 