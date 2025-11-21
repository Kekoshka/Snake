
using Microsoft.Extensions.Caching.Memory;
using Snake.Extensions;
using Snake.Interfaces;
using Snake.Models;

namespace Snake.Services
{
    public class SnakeDriverService : IHostedService
    {
        IFieldService _fieldService;
        IMemoryCache _cache;
        Timer _timer;
        Field _field;
        public SnakeDriverService(IMemoryCache cache, IFieldService fieldService)
        {
            _cache = cache;
            _fieldService = fieldService;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _timer = new Timer(ChangeSnakePlace, null, 0, 50);
            return Task.CompletedTask;
        }

        private void ChangeSnakePlace(object? state)
        {
            var snakes = _cache.GetKeyValueItems<Models.Snake>(key => key.StartsWith("S_"));
            snakes.ForEach(s =>
            {
                var snake = s.Value;
                _field = _cache.Get<Field>($"F_{snake.FieldId}")!;
                var tail = snake.SnakePositions.OrderByDescending(sp => sp.Order).First();
                ChangeBodyPlace(snake);
                ChangeHeadPlace(snake);
                if (IsEatApple(snake))
                {
                    AppendSnakeLength(snake, tail);
                    _fieldService.GenerateNewApple(_field);
                }
                if (IsSnakeDie(snakes.Select(s => s.Value).ToList(),
                    snake))
                    _cache.Remove($"S_{snake.Id}");
                _cache.Set($"S_{snake.Id}", snake);
            }
            );
        }


        private void ChangeHeadPlace(Models.Snake snake)
        {
            var oldSnakeHeadPlace = snake.SnakePositions.Single(sp => sp.Order == 1);
            var newSnakeHeadPlace = snake.Orientation switch
            {
                1 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X, Y = oldSnakeHeadPlace.Y + 1 },
                2 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X + 1, Y = oldSnakeHeadPlace.Y },
                3 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X, Y = oldSnakeHeadPlace.Y - 1 },
                4 => new SnakePosition { Order = 0, X = oldSnakeHeadPlace.X - 1, Y = oldSnakeHeadPlace.Y }
            };
            snake.SnakePositions.Add(newSnakeHeadPlace);
        }
        private void ChangeBodyPlace(Models.Snake snake)
        {
            snake.SnakePositions.Remove(snake.SnakePositions.OrderByDescending(sp => sp.Order).First());
            snake.SnakePositions.ToList().ForEach(sp => sp.Order += 1);
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
        private void AppendSnakeLength(Models.Snake snake,SnakePosition tail)
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
