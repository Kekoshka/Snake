using Microsoft.Extensions.Caching.Memory;

namespace Snake.Extensions
{
    public static class MemoryCacheExtensions
    {
        public static List<T> GetItemsByPrefix<T>(this IMemoryCache memoryCache, string pattern)
        {
            List<T> snakes = new();
            var cache = memoryCache as MemoryCache;
            var keys = cache.Keys.Where(k => k.ToString().StartsWith(pattern)).Select(k => k.ToString());
            foreach(var key in keys)
                snakes.Add(cache.Get<T>(key));
            return snakes;
        }
    }
}
