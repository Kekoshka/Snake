namespace Snake.Models
{
    public class Field
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Height { get; set; }
        public int Width { get; set; }
        public ICollection<PlayerSnake> PlayersSnakes { get; set; }
    }
}
