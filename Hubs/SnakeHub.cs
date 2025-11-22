using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Snake.Interfaces;
using Snake.Models;
using Snake.Models.DTO;

namespace Snake.Hubs
{
    public class SnakeHub : Hub
    {
        IMemoryCache _cache;
        IFieldService _fieldService;
        ISnakeService _snakeService;
        ISnakePositionSerice _snakePositionSerice;
        public SnakeHub(IMemoryCache cache,
            IFieldService fieldService,
            ISnakeService snakeService,
            ISnakePositionSerice snakePositionSerice)
        {
            _cache = cache;
            _fieldService = fieldService;
            _snakeService = snakeService;
            _snakePositionSerice = snakePositionSerice;
        }
        public async Task JoinGame(Guid fieldId, string snakeName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, fieldId.ToString());
            var field = _cache.Get<Field>($"F_{fieldId}");
            if (field is null)
                return;
            _snakeService.CreateSnakeAndAddToFieldAsync(snakeName, Context.ConnectionId, field);
            var snakePositions = _snakePositionSerice.GetAllSnakePositions(fieldId);
            await Clients.Group(fieldId.ToString()).SendAsync("AddSnakeToField", snakePositions);
        }
        public async Task ChangeOrientation(int SnakeId, int orientation)
        {
            var snake = _cache.Get<Models.Snake>($"S_{SnakeId}");
            if (snake is null || snake.UserIP != Context.ConnectionId) return;
            snake.Orientation = orientation;
            _cache.Set($"S_{SnakeId}", snake);
        }
        public async Task CreateGame(FieldDTO newField)
        {
            _fieldService.CreateNewField(newField);
        }

    }
}
