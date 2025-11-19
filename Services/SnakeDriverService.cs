
using Microsoft.Extensions.Caching.Memory;
using Snake.Extensions;

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
        }

        private void UpdateSnakePlace()
        {
            var snakes = _cache.GetKeyValueItems<Models.Snake>(key => key.StartsWith("S_"));
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
