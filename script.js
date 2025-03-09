document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const taskList = document.getElementById('taskList');
    const sortByPriorityButton = document.getElementById('sortByPriority');
    const sortByDueDateButton = document.getElementById('sortByDueDate');
    

    var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'))
    var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl)
    });
    

    loadTasks();
    
    addTaskButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    

    sortByPriorityButton.addEventListener('click', () => sortTasks('priority'));
    sortByDueDateButton.addEventListener('click', () => sortTasks('dueDate'));

    function addTask() {
        const task = taskInput.value.trim();
   
        if (task) {
            
            const taskObj = {
                id: Date.now().toString(),
                text: task,
                completed: false,
                priority: 'medium', 
                dueDate: '' 
            };
            

            renderTask(taskObj);
            

            saveTask(taskObj);
            

            taskInput.value = '';
            taskInput.focus();
        }
    }
    
    function renderTask(taskObj) {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.dataset.id = taskObj.id;
        

        if (taskObj.completed) {
            listItem.classList.add('list-group-item-success');
        }
        

        if (taskObj.priority === 'high') {
            listItem.classList.add('border-danger');
        } else if (taskObj.priority === 'low') {
            listItem.classList.add('border-info');
        }
        

        const isOverdue = taskObj.dueDate && new Date(taskObj.dueDate) < new Date() && !taskObj.completed;
        

        const priorityBadge = taskObj.priority !== 'medium' 
            ? `<span class="badge bg-${taskObj.priority === 'high' ? 'danger' : 'info'} ms-2">${taskObj.priority}</span>` 
            : '';
            

        const dueDateElement = taskObj.dueDate 
            ? `<small class="text-muted ms-2 ${isOverdue ? 'text-danger' : ''}">${taskObj.dueDate}</small>` 
            : '';
        

        const dropdownId = `dropdown-${taskObj.id}`;
        
        listItem.innerHTML = `
            <div class="task-content ${taskObj.completed ? 'text-decoration-line-through' : ''}">
                <span class="task-text">${taskObj.text}</span>
                ${dueDateElement}
                ${priorityBadge}
            </div>
            <div class="btn-group">
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="${dropdownId}" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-flag me-1"></i>Priority
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="${dropdownId}">
                        <li><a class="dropdown-item priority-item" href="#" data-priority="high" data-task-id="${taskObj.id}">High</a></li>
                        <li><a class="dropdown-item priority-item" href="#" data-priority="medium" data-task-id="${taskObj.id}">Medium</a></li>
                        <li><a class="dropdown-item priority-item" href="#" data-priority="low" data-task-id="${taskObj.id}">Low</a></li>
                    </ul>
                </div>
                <button class="btn btn-sm btn-outline-primary date-button">
                    <i class="far fa-calendar-alt me-1"></i>Due Date
                </button>
                <button class="btn btn-sm btn-outline-warning edit-button">
                    <i class="fas fa-edit me-1"></i>Edit
                </button>
                <button class="btn btn-sm btn-success done-button">
                    <i class="fas fa-check me-1"></i>Done
                </button>
                <button class="btn btn-sm btn-danger delete-button">
                    <i class="fas fa-trash-alt me-1"></i>Delete
                </button>
            </div>
        `;
        
        taskList.appendChild(listItem);
        

        const dropdownToggle = document.getElementById(dropdownId);
        if (dropdownToggle) {
            new bootstrap.Dropdown(dropdownToggle);
        }
        
        const dateButton = listItem.querySelector('.date-button');
        dateButton.addEventListener('click', () => {
            const date = prompt('Enter due date (YYYY-MM-DD):', taskObj.dueDate);
            if (date !== null) {
                taskObj.dueDate = date;
                updateTask(taskObj);
                const oldListItem = document.querySelector(`li[data-id="${taskObj.id}"]`);
                taskList.removeChild(oldListItem);
                renderTask(taskObj);
            }
        });
    }
    
    taskList.addEventListener('click', (e) => {
        const listItem = e.target.closest('li');
        if (!listItem) return;
        
        const taskId = listItem.dataset.id;
        const taskObj = getTaskById(taskId);
        
        if (e.target.classList.contains('delete-button') || e.target.closest('.delete-button')) {
            taskList.removeChild(listItem);
            deleteTask(taskId);
        } else if (e.target.classList.contains('done-button') || e.target.closest('.done-button')) {
            listItem.classList.toggle('list-group-item-success');
            const taskText = listItem.querySelector('.task-content');
            taskText.classList.toggle('text-decoration-line-through');
            
            taskObj.completed = !taskObj.completed;
            updateTask(taskObj);
        } else if (e.target.classList.contains('edit-button') || e.target.closest('.edit-button')) {
            const taskTextElement = listItem.querySelector('.task-text');
            const currentText = taskTextElement.textContent;
            const newText = prompt('Edit task:', currentText);
            
            if (newText && newText.trim() !== '') {
                taskTextElement.textContent = newText;
                
                taskObj.text = newText;
                updateTask(taskObj);
            }
        } else if (e.target.classList.contains('priority-item')) {
            e.preventDefault();
            const priority = e.target.dataset.priority;
            const targetTaskId = e.target.dataset.taskId;
            
            if (targetTaskId === taskId) {
                updatePriority(taskObj, priority, listItem);
            }
        }
    });
    
    function updatePriority(taskObj, priority, listItem) {
        listItem.classList.remove('border-danger', 'border-info');
        
        if (priority === 'high') {
            listItem.classList.add('border-danger');
        } else if (priority === 'low') {
            listItem.classList.add('border-info');
        }
        
        const taskContent = listItem.querySelector('.task-content');
        const badges = taskContent.querySelectorAll('.badge');
        badges.forEach(badge => badge.remove());
        
        if (priority !== 'medium') {
            const newBadge = document.createElement('span');
            newBadge.className = `badge bg-${priority === 'high' ? 'danger' : 'info'} ms-2`;
            newBadge.textContent = priority;
            taskContent.appendChild(newBadge);
        }
        
        taskObj.priority = priority;
        updateTask(taskObj);
        
        const activeSortButton = document.querySelector('.btn-outline-secondary.active');
        if (activeSortButton && activeSortButton.id === 'sortByPriority') {
            sortTasks('priority');
        }
    }
    
    function saveTask(taskObj) {
        const tasks = getAllTasks();
        tasks.push(taskObj);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function getAllTasks() {
        const tasksJSON = localStorage.getItem('tasks');
        return tasksJSON ? JSON.parse(tasksJSON) : [];
    }
    
    function getTaskById(id) {
        const tasks = getAllTasks();
        return tasks.find(task => task.id === id);
    }
    
    function updateTask(updatedTask) {
        const tasks = getAllTasks();
        const index = tasks.findIndex(task => task.id === updatedTask.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }
    
    function deleteTask(id) {
        const tasks = getAllTasks().filter(task => task.id !== id);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function loadTasks() {
        const tasks = getAllTasks();
        tasks.sort((a, b) => {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        tasks.forEach(task => renderTask(task));
    }
    
    function sortTasks(sortBy) {
        const tasks = getAllTasks();
        
        document.querySelectorAll('.btn-outline-secondary').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (sortBy === 'priority') {
            document.getElementById('sortByPriority').classList.add('active');
            tasks.sort((a, b) => {
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
        } else if (sortBy === 'dueDate') {
            document.getElementById('sortByDueDate').classList.add('active');
            tasks.sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        }
        
        taskList.innerHTML = '';
        tasks.forEach(task => renderTask(task));
    }
});