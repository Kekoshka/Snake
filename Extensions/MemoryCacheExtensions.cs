using Microsoft.Extensions.Caching.Memory;

namespace Snake.Extensions
{
    public static class MemoryCacheExtensions
    {
        public static IEnumerable<KeyValuePair<object, object>> AsEnumerable(this IMemoryCache cache)
        {
            return (cache as MemoryCache)?.AsEnumerable() ?? Enumerable.Empty<KeyValuePair<object, object>>();
        }

        public static List<T> GetItemsByPattern<T>(this IMemoryCache cache, string pattern)
        {
            return cache.AsEnumerable()
                .Where(item => item.Key.ToString().Contains(pattern) && item.Value is T)
                .Select(item => (T)item.Value)
                .ToList();
        }

        public static List<KeyValuePair<string, T>> GetKeyValueItems<T>(this IMemoryCache cache, Func<string, bool> keyPredicate)
        {
            return cache.AsEnumerable()
                .Where(item => keyPredicate(item.Key.ToString()) && item.Value is T)
                .Select(item => new KeyValuePair<string, T>(item.Key.ToString(), (T)item.Value))
                .ToList();
        }
    }
}
