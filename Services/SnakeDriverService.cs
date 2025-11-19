
using Microsoft.Extensions.Caching.Memory;
using Snake.Enums;
using Snake.Extensions;
using Snake.Models;

namespace Snake.Services
{
    public class SnakeDriverService : IHostedService
    {
        IMemoryCache _cache;
        Timer _timer;
        SnakeDriverService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _timer = new Timer(UpdateSnakePlace, null, 0, 50);
            return Task.CompletedTask;
        }

        private void UpdateSnakePlace(object? state)
        {
            var snakes = _cache.GetKeyValueItems<Models.Snake>(key => key.StartsWith("S_"));
            snakes.ForEach(snake =>
            {
                ChangeBodyPlace(snake.Value);
                ChangeHeadPlace(snake.Value);
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
    }
}
