class SnakeGame {
    constructor() {
        this.connection = null;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentScreen = 'mainScreen';
        this.snakes = new Map();
        this.apple = null;
        this.fieldId = null;
        this.snakeId = null;
        this.playerName = null;
        this.fieldSize = { width: 0, height: 0 };
        this.cellSize = 20;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('createGameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGame();
        });

        document.getElementById('joinGameForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinGame();
        });

        document.getElementById('leaveGame').addEventListener('click', () => {
            this.leaveGame();
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        this.canvas.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
    }

    async createGame() {
        const gameName = document.getElementById('gameName').value;
        const width = parseInt(document.getElementById('fieldWidth').value);
        const height = parseInt(document.getElementById('fieldHeight').value);

        try {
            await this.connectToHub();

            const fieldDTO = {
                name: gameName,
                height: height,
                width: width
            };

            await this.connection.invoke('CreateGame', fieldDTO);
        } catch (error) {
            console.error('Ошибка создания игры:', error);
            this.showMessage('Ошибка создания игры: ' + error.message);
        }
    }

    async joinGame() {
        const playerName = document.getElementById('playerName').value;
        const fieldId = document.getElementById('fieldId').value;

        if (!fieldId) {
            this.showMessage('Введите ID игры');
            return;
        }

        try {
            await this.connectToHub();

            this.fieldId = fieldId;
            this.playerName = playerName;

            console.log('Joining game with fieldId:', fieldId, 'playerName:', playerName);

            await this.connection.invoke('JoinGame', fieldId, playerName);

            this.showGameScreen();
            this.updateGameInfo(`Игра: ${fieldId}`);
            this.updatePlayerInfo(`Игрок: ${playerName}`);
            this.updateConnectionInfo('Подключено к игре');

            setTimeout(() => {
                this.canvas.focus();
            }, 100);

        } catch (error) {
            console.error('Ошибка подключения:', error);
            this.showMessage('Ошибка подключения к игре: ' + error.message);
        }
    }

    async connectToHub() {
        if (this.connection && this.connection.state === 'Connected') {
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl('/snakeHub')
            .withAutomaticReconnect()
            .build();

        this.setupHubListeners();

        try {
            await this.connection.start();
            console.log('SignalR подключен');
            this.updateConnectionInfo('Подключено к серверу');
        } catch (err) {
            console.error('Ошибка подключения SignalR:', err);
            this.showMessage('Не удалось подключиться к серверу');
            throw err;
        }
    }

    setupHubListeners() {
        this.connection.on('AddSnakeToField', (snakePositions) => {
            console.log('AddSnakeToField received:', snakePositions);
            this.addSnakes(snakePositions);
        });

        this.connection.on('UpdateApplePosition', (apple) => {
            console.log('UpdateApplePosition received:', apple);
            this.apple = apple;
            this.drawGame();
        });

        this.connection.on('UpdateSnakePositions', (snakePositions) => {
            console.log('UpdateSnakePositions received:', snakePositions);
            this.updateSnakePositions(snakePositions);
        });

        this.connection.on('DeleteSnakeFromField', (snakeId) => {
            console.log('DeleteSnakeFromField received:', snakeId);
            this.deleteSnake(snakeId);
        });

        this.connection.on('SetSnakeId', (snakeId) => {
            console.log('SetSnakeId received:', snakeId);
            this.snakeId = snakeId;
            this.updatePlayerInfo(`Игрок: ${this.playerName} (ID: ${snakeId})`);
        });

        this.connection.on('ReceiveFieldSize', (width, height) => {
            console.log('ReceiveFieldSize received:', width, height);
            this.fieldSize = { width, height };
            this.setCanvasSize();
            this.drawGame();
        });

        this.connection.onreconnecting(() => {
            this.updateConnectionInfo('Переподключение...');
        });

        this.connection.onreconnected(() => {
            this.updateConnectionInfo('Переподключено');
        });

        this.connection.onclose(() => {
            this.updateConnectionInfo('Соединение потеряно');
            this.showMessage('Соединение с сервером потеряно');
        });
    }

    addSnakes(snakePositions) {
        snakePositions.forEach(position => {
            if (!this.snakes.has(position.snakeId)) {
                this.snakes.set(position.snakeId, []);
            }
            const existing = this.snakes.get(position.snakeId).find(p =>
                p.x === position.x && p.y === position.y
            );
            if (!existing) {
                this.snakes.get(position.snakeId).push({
                    x: position.x,
                    y: position.y
                });
            }
        });
        this.drawGame();
    }

    updateSnakePositions(snakePositions) {
        snakePositions.forEach(position => {
            const snake = this.snakes.get(position.snakeId);
            if (snake) {
                if (position.action === 1) { // Append
                    snake.unshift({ x: position.x, y: position.y });
                } else { // Remove
                    const tailIndex = snake.findIndex(segment =>
                        segment.x === position.x && segment.y === position.y
                    );
                    if (tailIndex !== -1) {
                        snake.splice(tailIndex, 1);
                    }
                }
            }
        });
        this.drawGame();
    }

    deleteSnake(snakeId) {
        this.snakes.delete(snakeId);
        this.drawGame();
    }

    handleKeyPress(e) {
        if (this.currentScreen !== 'gameScreen' || !this.connection) {
            return;
        }

        if (!this.snakeId) {
            return;
        }

        let orientation;
        switch (e.key) {
            case 'ArrowUp':
                orientation = 1;
                break;
            case 'ArrowRight':
                orientation = 2;
                break;
            case 'ArrowDown':
                orientation = 3;
                break;
            case 'ArrowLeft':
                orientation = 4;
                break;
            default:
                return;
        }

        e.preventDefault();

        this.connection.invoke('ChangeOrientation', this.snakeId, orientation)
            .catch(err => {
                console.error('Error sending orientation change:', err);
            });
    }

    setCanvasSize() {
        this.canvas.width = this.fieldSize.width * this.cellSize;
        this.canvas.height = this.fieldSize.height * this.cellSize;
    }

    drawGame() {
        if (this.fieldSize.width === 0 || this.fieldSize.height === 0) {
            return;
        }

        // Очистка с красивым градиентом
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем сетку с эффектом свечения
        this.drawGrid();

        // Рисуем яблоко
        if (this.apple) {
            this.drawApple(this.apple);
        }

        // Рисуем змейки
        this.snakes.forEach((positions, snakeId) => {
            this.drawSnake(positions, snakeId);
        });
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        // Вертикальные линии
        for (let x = 0; x <= this.fieldSize.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Горизонтальные линии
        for (let y = 0; y <= this.fieldSize.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }

        // Угловые акценты
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawApple(apple) {
        const x = apple.x * this.cellSize + this.cellSize / 2;
        const y = apple.y * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize / 2 - 1;

        // Тень
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // Основное тело яблока с градиентом
        const gradient = this.ctx.createRadialGradient(
            x - radius / 3, y - radius / 3, 0,
            x, y, radius
        );
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.7, '#cc0000');
        gradient.addColorStop(1, '#990000');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Блик
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Черенок
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - radius);
        this.ctx.lineTo(x, y - radius - 3);
        this.ctx.stroke();

        // Листик
        this.ctx.fillStyle = '#00cc00';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 1, y - radius - 1, radius / 3, radius / 4, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Сбрасываем тень
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    drawSnake(positions, snakeId) {
        const isCurrentPlayer = snakeId === this.snakeId;

        // Рисуем тело змейки
        for (let i = positions.length - 1; i >= 0; i--) {
            const pos = positions[i];
            const x = pos.x * this.cellSize;
            const y = pos.y * this.cellSize;
            const size = this.cellSize - 1;

            if (i === 0) {
                // Голова змейки
                this.drawSnakeHead(x, y, size, isCurrentPlayer, snakeId);
            } else {
                // Тело змейки
                this.drawSnakeSegment(x, y, size, i, positions.length, isCurrentPlayer, snakeId);
            }
        }
    }

    drawSnakeSegment(x, y, size, index, totalLength, isCurrentPlayer, snakeId) {
        const segmentColor = this.getSnakeColor(snakeId, index, totalLength);

        // Тень для объема
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // Основной сегмент с градиентом
        const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
        const baseColor = this.getSnakeColor(snakeId);
        gradient.addColorStop(0, this.lightenColor(baseColor, 20));
        gradient.addColorStop(1, this.darkenColor(baseColor, 10));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, size, size);

        // Скругленные углы
        this.ctx.strokeStyle = this.darkenColor(baseColor, 20);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

        // Внутренний блик
        this.ctx.strokeStyle = this.lightenColor(baseColor, 30);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

        // Сбрасываем тень
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    drawSnakeHead(x, y, size, isCurrentPlayer, snakeId) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2;

        // Тень для головы
        this.ctx.shadowColor = isCurrentPlayer ? 'rgba(255, 255, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;

        // Голова с градиентом
        const headGradient = this.ctx.createRadialGradient(
            centerX - radius / 3, centerY - radius / 3, 0,
            centerX, centerY, radius
        );

        if (isCurrentPlayer) {
            headGradient.addColorStop(0, '#ffff00');
            headGradient.addColorStop(0.7, '#ffcc00');
            headGradient.addColorStop(1, '#ff9900');
        } else {
            const baseColor = this.getSnakeColor(snakeId);
            headGradient.addColorStop(0, this.lightenColor(baseColor, 40));
            headGradient.addColorStop(0.7, baseColor);
            headGradient.addColorStop(1, this.darkenColor(baseColor, 20));
        }

        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Глаза
        const eyeSize = radius / 3;
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius / 2, centerY - radius / 3, eyeSize, 0, Math.PI * 2);
        this.ctx.arc(centerX + radius / 2, centerY - radius / 3, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Зрачки
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius / 2, centerY - radius / 3, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.arc(centerX + radius / 2, centerY - radius / 3, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Ноздри
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius / 4, centerY + radius / 4, eyeSize / 3, 0, Math.PI * 2);
        this.ctx.arc(centerX + radius / 4, centerY + radius / 4, eyeSize / 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Сбрасываем тень
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    getSnakeColor(snakeId, segmentIndex = 0, totalSegments = 1) {
        const colors = [
            '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
            '#009688', '#E91E63', '#00BCD4', '#FF5722',
            '#8BC34A', '#CDDC39', '#FFC107', '#795548'
        ];

        let hash = 0;
        for (let i = 0; i < snakeId.length; i++) {
            hash = snakeId.charCodeAt(i) + ((hash << 5) - hash);
        }

        const baseColor = colors[Math.abs(hash) % colors.length];

        // Создаем вариацию цвета для разных сегментов
        if (segmentIndex > 0 && totalSegments > 1) {
            const darkenAmount = (segmentIndex / totalSegments) * 30;
            return this.darkenColor(baseColor, darkenAmount);
        }

        return baseColor;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (
            0x1000000 +
            (R > 0 ? (R > 255 ? 255 : R) : 0) * 0x10000 +
            (G > 0 ? (G > 255 ? 255 : G) : 0) * 0x100 +
            (B > 0 ? (B > 255 ? 255 : B) : 0)
        ).toString(16).slice(1);
    }

    showGameScreen() {
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        this.currentScreen = 'gameScreen';

        setTimeout(() => {
            this.canvas.focus();
        }, 100);
    }

    returnToMainScreen() {
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('mainScreen').classList.add('active');
        this.currentScreen = 'mainScreen';
        this.cleanupGame();
    }

    leaveGame() {
        if (this.connection) {
            this.connection.stop();
        }
        this.returnToMainScreen();
    }

    cleanupGame() {
        this.snakes.clear();
        this.apple = null;
        this.fieldId = null;
        this.snakeId = null;
        this.playerName = null;
        this.fieldSize = { width: 0, height: 0 };
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    updateGameInfo(info) {
        document.getElementById('gameInfo').textContent = info;
    }

    updatePlayerInfo(info) {
        document.getElementById('playerInfo').textContent = info;
    }

    updateConnectionInfo(info) {
        document.getElementById('connectionInfo').textContent = 'Статус: ' + info;
    }

    showMessage(message) {
        // Красивое уведомление вместо alert
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Добавляем стили для анимации уведомления
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});