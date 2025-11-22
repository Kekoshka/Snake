
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Snake.Extensions;
using Snake.Hubs;
using Snake.Interfaces;
using Snake.Models;
using Snake.Models.DTO;

namespace Snake.Services
{
    public class SnakeDriverService : IHostedService
    {
        IFieldService _fieldService;
        IMemoryCache _cache;
        IHubContext<SnakeHub> _hubContext;
        Timer _timer;
        Field _field;
        List<SnakePositionDTO> _snakePositions;
        public SnakeDriverService(IMemoryCache cache,
            IFieldService fieldService,
            IHubContext<SnakeHub> hubContext)
        {
            _cache = cache;
            _fieldService = fieldService;
            _hubContext = hubContext;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _timer = new Timer(ChangeSnakePlace, null, 0, 400);
            return Task.CompletedTask;
        }

        private void ChangeSnakePlace(object? state)
        {
            var snakes = _cache.GetItemsByPrefix<Models.Snake>("S_");
            snakes.ForEach(async s =>
            {
                var snake = s;
                _field = _cache.Get<Field>($"F_{snake.FieldId}")!;
                _snakePositions = new();
                var tail = snake.SnakePositions.OrderByDescending(sp => sp.Order).First();
                ChangeBodyPlace(snake);
                ChangeHeadPlace(snake);
                if (IsEatApple(snake))
                {
                    AppendSnakeLength(snake, tail);
                    _fieldService.GenerateNewApple(_field);
                    await _hubContext.Clients.Group(snake.FieldId.ToString()).SendAsync("UpdateApplePosition", _field.Apple);
                }
                if (IsSnakeDie(snakes.Select(s => s).ToList(),
                    snake))
                {
                    _cache.Remove($"S_{snake.Id}");
                    await _hubContext.Clients.Group(snake.FieldId.ToString()).SendAsync("DeleteSnakeFromField", snake.Id);
                    return;
                }
                _cache.Set($"S_{snake.Id}", snake);
                await _hubContext.Clients.Group(snake.FieldId.ToString()).SendAsync("UpdateSnakePositions", _snakePositions);
            }
            );
        }


        private void ChangeHeadPlace(Models.Snake snake)
        {
            var oldSnakeHeadPlace = snake.SnakePositions.Single(sp => sp.Order == 1);
            var newSnakeHeadPlace = snake.Orientation switch
            {
                1 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X, Y = oldSnakeHeadPlace.Y - 1 },
                2 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X + 1, Y = oldSnakeHeadPlace.Y },
                3 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X, Y = oldSnakeHeadPlace.Y + 1 },
                4 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X - 1, Y = oldSnakeHeadPlace.Y }
            };
            snake.SnakePositions.Add(newSnakeHeadPlace);
            _snakePositions.Add(new SnakePositionDTO
            {
                SnakeId = snake.Id,
                X = newSnakeHeadPlace.X,
                Y = newSnakeHeadPlace.Y,
                Action = Enums.Action.Append.GetHashCode()
            });
        }
        private void ChangeBodyPlace(Models.Snake snake)
        {
            var deletedPosition = snake.SnakePositions.OrderByDescending(sp => sp.Order).First();
            snake.SnakePositions.Remove(deletedPosition);
            snake.SnakePositions.ToList().ForEach(sp => sp.Order += 1);
            _snakePositions.Add(new SnakePositionDTO
            {
                SnakeId = snake.Id,
                X = deletedPosition.X,
                Y = deletedPosition.Y,
                Action = Enums.Action.Remove.GetHashCode()
            });
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
        private bool IsSnakeDie(List<Models.Snake> snakes, Models.Snake snake)
        {
            var headPosition = snake.SnakePositions.Single(sp => sp.Order == 0);
            return snakes.Any(s => s.Id != snake.Id && s.SnakePositions.Any(sp => sp.Y == headPosition.Y && sp.X == headPosition.X)) ||
            headPosition.Y < 0 || headPosition.X < 0 || headPosition.X > _field.Width || headPosition.Y > _field.Height;

        }

        private bool IsEatApple(Models.Snake snake)
        {
            var applePosition = _field.Apple;
            return snake.SnakePositions.Any(sp => sp.Order == 0 &&
                sp.X == applePosition.X &&
                sp.Y == applePosition.Y);
        }
        private void AppendSnakeLength(Models.Snake snake, SnakePosition tail)
        {
            var newSnakePosition = new SnakePosition
            {
                Id = Guid.NewGuid(),
                Order = snake.SnakePositions.Count,
                X = tail.X,
                Y = tail.Y
            };
            snake.SnakePositions.Add(newSnakePosition);
        }
    }
}
