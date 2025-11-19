namespace Snake.Models
{
    public class Field
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Height { get; set; }
        public int Width { get; set; }
        public Apple Apple {get;set;}
        public ICollection<Snake> Snakes { get; set; }
    }
}
