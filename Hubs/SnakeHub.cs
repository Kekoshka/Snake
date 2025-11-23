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

            var snake = await _snakeService.CreateSnakeAndAddToFieldAsync(snakeName, Context.ConnectionId, field);
            var snakePositions = _snakePositionSerice.GetAllSnakePositions(fieldId);

            await Clients.Caller.SendAsync("SetSnakeId", snake.Id);
            await Clients.Caller.SendAsync("ReceiveFieldSize", field.Width, field.Height);
            await Clients.Group(fieldId.ToString()).SendAsync("AddSnakeToField", snakePositions);
            await Clients.Caller.SendAsync("UpdateApplePosition", field.Apple);
        }
        public async Task ChangeOrientation(Guid SnakeId, int orientation)
        {
            var snake = _cache.Get<Models.Snake>($"S_{SnakeId}");
            if (IsOpositeOrientation(snake.Orientation, orientation)) return;
            if (snake is null || snake.UserIP != Context.ConnectionId) return;
            snake.Orientation = orientation;
            _cache.Set($"S_{SnakeId}", snake);
        }
        public async Task<Guid> CreateGame(FieldDTO newField)
        {
            return _fieldService.CreateNewField(newField);
        }

        private bool IsOpositeOrientation(int snakeOrientation, int newOrientation) =>
            newOrientation switch
            {
                1 => snakeOrientation == 3,
                2 => snakeOrientation == 4,
                3 => snakeOrientation == 1,
                4 => snakeOrientation == 2,
                _ => false
            };
    }
}
