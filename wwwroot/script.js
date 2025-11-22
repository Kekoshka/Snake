javascript
class SnakeGame {
    constructor() {
        this.connection = null;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 20;

        this.currentField = null;
        this.snakes = new Map();
        this.apple = null; // Добавляем хранение яблока
        this.currentSnakeId = null;
        this.isAlive = true;
        this.createdGameId = null;

        this.initializeConnection();
        this.setupEventListeners();
    }

    initializeConnection() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl('/snakeHub')
            .withAutomaticReconnect()
            .build();

        this.setupHubMethods();
    }

    setupHubMethods() {
        // При получении всех позиций змей при подключении
        this.connection.on('AddSnakeToField', (snakePositions) => {
            this.clearGame();
            snakePositions.forEach(position => {
                this.addSnakeSegment(position.snakeId, position.x, position.y);
            });
            this.drawGame();
        });

        // Получаем ID нашей змейки при создании
        this.connection.on('SnakeCreated', (snakeId) => {
            this.currentSnakeId = snakeId;
            console.log('Snake created with ID:', snakeId);
        });

        // При обновлении позиций змей
        this.connection.on('UpdateSnakePositions', (positions) => {
            positions.forEach(position => {
                if (position.action === 1) { // Append
                    this.addSnakeSegment(position.snakeId, position.x, position.y);
                } else { // Remove
                    this.removeSnakeSegment(position.snakeId, position.x, position.y);
                }
            });
            this.drawGame();
        });

        // При удалении змеи
        this.connection.on('DeleteSnakeFromField', (snakeId) => {
            this.snakes.delete(snakeId);
            this.drawGame();

            if (snakeId === this.currentSnakeId) {
                this.showGameOver();
            }
        });

        // Получаем позицию яблока
        this.connection.on('UpdateApplePosition', (apple) => {
            this.apple = apple;
            this.drawGame();
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.currentSnakeId || !this.isAlive) {
                return;
            }

            let orientation;
            switch (e.key) {
                case 'ArrowUp':
                    orientation = 1; // Top
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    orientation = 2; // Right
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    orientation = 3; // Bottom
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    orientation = 4; // Left
                    e.preventDefault();
                    break;
                default:
                    return;
            }

            this.connection.invoke('ChangeOrientation', this.currentSnakeId, orientation)
                .then(() => {
                    console.log('Direction changed successfully');
                })
                .catch(err => {
                    console.error('Error changing direction:', err);
                });
        });
    }

    // Остальные методы остаются без изменений
    async createGame() {
        const gameName = document.getElementById('newGameName').value.trim();
        const width = parseInt(document.getElementById('gameWidth').value);
        const height = parseInt(document.getElementById('gameHeight').value);

        if (!gameName) {
            this.showError('Введите название игры');
            return;
        }

        if (width < 20 || height < 20) {
            this.showError('Минимальный размер поля: 20x20');
            return;
        }

        try {
            await this.startConnection();

            const fieldDTO = {
                name: gameName,
                height: height,
                width: width,
                apple: null
            };

            const gameId = await this.connection.invoke('CreateGame', fieldDTO);

            this.createdGameId = gameId;
            this.showCreatedGameInfo(gameId, gameName);

        } catch (err) {
            console.error('Error creating game:', err);
            this.showError('Ошибка при создании игры');
        }
    }

    showCreatedGameInfo(gameId, gameName) {
        const gameIdInput = document.getElementById('createdGameId');
        const gameCreatedInfo = document.getElementById('gameCreatedInfo');

        gameIdInput.value = gameId;
        gameCreatedInfo.classList.remove('hidden');

        document.getElementById('joinGameId').value = gameId;
        document.getElementById('playerName').focus();

        this.showError(`Игра "${gameName}" создана! ID: ${gameId}`);
    }

    async joinCreatedGame() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            this.showError('Введите ваше имя');
            return;
        }

        await this.joinGameById(this.createdGameId, playerName);
    }

    async joinGame() {
        const fieldId = document.getElementById('joinGameId').value.trim();
        const playerName = document.getElementById('playerName').value.trim();

        if (!fieldId || !playerName) {
            this.showError('Введите ID игры и ваше имя');
            return;
        }

        await this.joinGameById(fieldId, playerName);
    }

    async joinGameById(fieldId, playerName) {
        try {
            await this.startConnection();

            const guid = this.parseGuid(fieldId);
            if (!guid) {
                this.showError('Неверный формат ID игры');
                return;
            }

            await this.connection.invoke('JoinGame', guid, playerName);

            this.currentField = guid;
            this.showGameScreen();
            this.resizeCanvas();
            this.updateGameIdDisplay(fieldId);

        } catch (err) {
            console.error('Error joining game:', err);
            this.showError('Ошибка при присоединении к игре');
        }
    }

    updateGameIdDisplay(gameId) {
        document.getElementById('gameIdDisplay').textContent = `ID: ${gameId}`;
    }

    copyGameId() {
        const gameIdInput = document.getElementById('createdGameId');
        gameIdInput.select();
        gameIdInput.setSelectionRange(0, 99999);

        try {
            navigator.clipboard.writeText(gameIdInput.value).then(() => {
                this.showError('ID игры скопирован в буфер обмена!');
            });
        } catch (err) {
            document.execCommand('copy');
            this.showError('ID игры скопирован в буфер обмена!');
        }
    }

    async startConnection() {
        if (this.connection.state === 'Connected') return;

        try {
            await this.connection.start();
            console.log('Connected to SignalR hub');
        } catch (err) {
            console.error('SignalR Connection Error:', err);
            this.showError('Не удалось подключиться к серверу. Проверьте, запущен ли сервер.');
            throw err;
        }
    }

    addSnakeSegment(snakeId, x, y) {
        if (!this.snakes.has(snakeId)) {
            this.snakes.set(snakeId, []);
        }

        const segments = this.snakes.get(snakeId);
        segments.push({ x, y });
    }

    removeSnakeSegment(snakeId, x, y) {
        if (!this.snakes.has(snakeId)) return;

        const segments = this.snakes.get(snakeId);
        const index = segments.findIndex(seg => seg.x === x && seg.y === y);

        if (index !== -1) {
            segments.splice(index, 1);
        }

        if (segments.length === 0) {
            this.snakes.delete(snakeId);
        }
    }

    drawGame() {
        this.clearCanvas();
        this.drawGrid();

        // Рисуем яблоко
        if (this.apple) {
            this.drawApple(this.apple.x, this.apple.y);
        }

        // Рисуем змей
        this.snakes.forEach((segments, snakeId) => {
            const isCurrentPlayer = snakeId === this.currentSnakeId;
            this.drawSnake(segments, snakeId, isCurrentPlayer);
        });

        this.updatePlayerInfo();
    }

    drawSnake(segments, snakeId, isCurrentPlayer) {
        const headColor = isCurrentPlayer ? '#4CAF50' : '#FF5722';
        const bodyColor = isCurrentPlayer ? '#8BC34A' : '#FF8A65';

        segments.forEach((segment, index) => {
            const isHead = index === 0;
            const color = isHead ? headColor : bodyColor;
            const size = isHead ? this.cellSize - 2 : this.cellSize - 4;
            const offset = isHead ? 1 : 2;

            this.ctx.fillStyle = color;
            this.ctx.fillRect(
                segment.x * this.cellSize + offset,
                segment.y * this.cellSize + offset,
                size,
                size
            );

            if (isHead) {
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    segment.x * this.cellSize + offset,
                    segment.y * this.cellSize + offset,
                    size,
                    size
                );
            }
        });
    }

    drawApple(x, y) {
        // Рисуем яблоко как красный круг
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(
            x * this.cellSize + this.cellSize / 2,
            y * this.cellSize + this.cellSize / 2,
            this.cellSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();

        // Добавляем зеленый листик
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.moveTo(x * this.cellSize + this.cellSize / 2, y * this.cellSize + 2);
        this.ctx.lineTo(x * this.cellSize + this.cellSize / 2 - 3, y * this.cellSize - 2);
        this.ctx.lineTo(x * this.cellSize + this.cellSize / 2 + 3, y * this.cellSize - 2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    clearCanvas() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clearGame() {
        this.snakes.clear();
        this.apple = null;
        this.currentSnakeId = null;
        this.isAlive = true;
        this.clearCanvas();
    }

    resizeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    updatePlayerInfo() {
        document.getElementById('playerCount').textContent = `Игроков: ${this.snakes.size}`;

        if (this.currentSnakeId && this.snakes.has(this.currentSnakeId)) {
            const segments = this.snakes.get(this.currentSnakeId);
            document.getElementById('playerScore').textContent = `Длина: ${segments.length}`;
        }
    }

    showGameScreen() {
        document.getElementById('gameSelection').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        document.getElementById('gameOver').classList.add('hidden');
    }

    showGameOver() {
        this.isAlive = false;
        document.getElementById('gameOver').classList.remove('hidden');
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        setTimeout(() => {
            errorElement.textContent = '';
        }, 5000);
    }

    async leaveGame() {
        this.clearGame();
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('gameSelection').classList.add('active');

        if (this.connection && this.connection.state === 'Connected') {
            await this.connection.stop();
        }
    }

    async respawn() {
        if (this.currentSnakeId) {
            try {
                await this.connection.invoke('RespawnSnake', this.currentSnakeId);
                this.isAlive = true;
                document.getElementById('gameOver').classList.add('hidden');
            } catch (err) {
                console.error('Error respawning snake:', err);
                this.showError('Ошибка при перерождении');
            }
        }
    }

    parseGuid(guidString) {
        const guidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (guidPattern.test(guidString)) {
            return guidString;
        }
        return null;
    }
}

// Глобальные функции
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new SnakeGame();

    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });

    document.getElementById('joinGameId').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
});

function createGame() {
    game.createGame();
}

function joinGame() {
    game.joinGame();
}

function joinCreatedGame() {
    game.joinCreatedGame();
}

function copyGameId() {
    game.copyGameId();
}

function leaveGame() {
    game.leaveGame();
}

function respawn() {
    game.respawn();
}