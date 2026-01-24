// Sample menu data - easy to replace
const restaurantName = "Restaurant Name";
const tagline = "Fresh ingredients, exceptional flavors";
const coverImage = "/restaurant.jpg";

const menuData = {
  starters: [
    {
      name: "Caesar Salad",
      price: "$12",
      description: "Crisp romaine lettuce with parmesan, croutons, and house-made caesar dressing"
    },
    {
      name: "Bruschetta",
      price: "$10",
      description: "Toasted bread topped with fresh tomatoes, basil, and garlic"
    },
    {
      name: "Soup of the Day",
      price: "$9",
      description: "Chef's daily selection, served with artisan bread"
    },
    {
      name: "Chicken Wings",
      price: "$14",
      description: "Six crispy wings with your choice of buffalo, BBQ, or honey garlic"
    }
  ],
  mains: [
    {
      name: "Grilled Salmon",
      price: "$28",
      description: "Fresh Atlantic salmon with lemon butter, served with seasonal vegetables and rice"
    },
    {
      name: "Ribeye Steak",
      price: "$35",
      description: "12oz prime ribeye, cooked to perfection, with mashed potatoes and asparagus"
    },
    {
      name: "Pasta Carbonara",
      price: "$22",
      description: "Classic Italian pasta with pancetta, parmesan, and creamy egg sauce"
    },
    {
      name: "Vegetarian Risotto",
      price: "$20",
      description: "Creamy arborio rice with seasonal vegetables, mushrooms, and parmesan"
    },
    {
      name: "Chicken Parmesan",
      price: "$24",
      description: "Breaded chicken breast with marinara sauce and mozzarella, served with pasta"
    }
  ],
  drinks: [
    {
      name: "Fresh Lemonade",
      price: "$5",
      description: "House-made with fresh lemons and a hint of mint"
    },
    {
      name: "Craft Beer Selection",
      price: "$7",
      description: "Ask your server for today's featured local brews"
    },
    {
      name: "Wine Selection",
      price: "$8-15",
      description: "Curated selection of reds, whites, and rosés by the glass"
    },
    {
      name: "Espresso",
      price: "$4",
      description: "Rich, bold espresso made with premium beans"
    },
    {
      name: "Iced Tea",
      price: "$4",
      description: "Refreshing house-brewed iced tea, sweetened or unsweetened"
    }
  ]
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative h-[70vh] sm:h-[80vh]">
        <img
          src={coverImage}
          alt={restaurantName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Text on image */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
            {restaurantName}
          </h1>
          {tagline && (
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light">
              {tagline}
            </p>
          )}
        </div>
      </section>

      {/* MENU SECTION */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Menu Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">
              Our Menu
            </h2>
            <div className="w-20 h-1 bg-black mx-auto"></div>
          </div>

          {/* Starters Category */}
          <div className="mb-12 sm:mb-16">
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 md:p-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8 pb-4 border-b-2 border-black">
                Starters
              </h3>
              <div className="space-y-6 sm:space-y-8">
                {menuData.starters.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h4 className="text-lg sm:text-xl font-bold text-black">
                        {item.name}
                      </h4>
                      <span className="text-lg sm:text-xl font-semibold text-black whitespace-nowrap">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mains Category */}
          <div className="mb-12 sm:mb-16">
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 md:p-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8 pb-4 border-b-2 border-black">
                Mains
              </h3>
              <div className="space-y-6 sm:space-y-8">
                {menuData.mains.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h4 className="text-lg sm:text-xl font-bold text-black">
                        {item.name}
                      </h4>
                      <span className="text-lg sm:text-xl font-semibold text-black whitespace-nowrap">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drinks Category */}
          <div className="mb-12 sm:mb-16">
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 md:p-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8 pb-4 border-b-2 border-black">
                Drinks
              </h3>
              <div className="space-y-6 sm:space-y-8">
                {menuData.drinks.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h4 className="text-lg sm:text-xl font-bold text-black">
                        {item.name}
                      </h4>
                      <span className="text-lg sm:text-xl font-semibold text-black whitespace-nowrap">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
