using Microsoft.Extensions.Caching.Memory;

namespace Snake.Services
{
    public class MainHandleService
    {
        IMemoryCache _cache;
        public MainHandleService(IMemoryCache cache) 
        {
            _cache = cache;
        }

    }
}
