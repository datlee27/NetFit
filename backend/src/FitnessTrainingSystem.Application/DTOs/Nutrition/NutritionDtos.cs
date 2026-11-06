namespace FitnessTrainingSystem.Application.DTOs.Nutrition;

/// <summary>
/// Response cho trang Nutrition — daily summary
/// </summary>
public class DailyNutritionSummaryDto
{
    public DateTime Date { get; set; }

    // Calorie overview
    public int CaloriesTarget { get; set; }
    public int CaloriesConsumed { get; set; }
    public decimal CaloriesBurned { get; set; }
    public int CaloriesRemaining { get; set; }
    public int NetCalories { get; set; } // Consumed - Burned

    // Macro breakdown
    public MacroSummaryDto Protein { get; set; } = new();
    public MacroSummaryDto Carbs { get; set; } = new();
    public MacroSummaryDto Fat { get; set; } = new();

    // Hydration
    public int WaterTargetGlasses { get; set; }
    public int WaterConsumedGlasses { get; set; }

    // User state
    public bool HasBodyMetrics { get; set; }
    public string FitnessGoal { get; set; } = "MAINTAIN";

    // Water Reminder Preferences
    public string? WaterReminderStartTime { get; set; }
    public string? WaterReminderEndTime { get; set; }

    // Workout Recovery Nutrition (Based on calories burned)
    public WorkoutRecoveryNutritionDto? WorkoutRecovery { get; set; }
}

public class MacroSummaryDto
{
    public decimal CurrentGrams { get; set; }
    public decimal TargetGrams { get; set; }
    public int Percentage { get; set; } // current/target * 100
}

/// <summary>
/// Request body to log water intake
/// </summary>
public class LogWaterDto
{
    public int Glasses { get; set; } = 1;
}

/// <summary>
/// Request body to log a food item consumed
/// </summary>
public class LogFoodDto
{
    public int FoodId { get; set; }
    public decimal Servings { get; set; } = 1.0m;
}

public class RecoveryNutrientAdviceDto
{
    public string Nutrient { get; set; } = string.Empty;
    public string TargetAmount { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Priority { get; set; } = "High";
    public string BestFoodSources { get; set; } = string.Empty;
}

public class RecommendedFoodDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ServingSize { get; set; }
    public string? Unit { get; set; }
    public int Calories { get; set; }
    public decimal Protein { get; set; }
    public decimal Carbs { get; set; }
    public decimal Fat { get; set; }
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public string CategoryLabel { get; set; } = string.Empty;
    public string RecoveryBenefit { get; set; } = string.Empty;
}

public class SuggestedMealSectionDto
{
    public string MealType { get; set; } = string.Empty; // "Breakfast", "Lunch", "Dinner", "Snack"
    public string MealTitle { get; set; } = string.Empty;
    public int Calories { get; set; }
    public decimal Protein { get; set; }
    public decimal Carbs { get; set; }
    public decimal Fat { get; set; }
    public List<RecommendedFoodDto> Foods { get; set; } = new();
}

public class SuggestedComboDto
{
    public string Title { get; set; } = string.Empty;
    public string MealType { get; set; } = "FullDay";
    public string TargetGoal { get; set; } = "Thực đơn cả ngày";
    public string Description { get; set; } = string.Empty;
    public int TotalCalories { get; set; }
    public decimal TotalProtein { get; set; }
    public decimal TotalCarbs { get; set; }
    public decimal TotalFat { get; set; }
    public List<RecommendedFoodDto> Foods { get; set; } = new();
    public List<SuggestedMealSectionDto> Meals { get; set; } = new();
}

public class WorkoutRecoveryNutritionDto
{
    public decimal CaloriesBurned { get; set; }
    public int RecommendedReplenishCalories { get; set; }
    public string GuidanceMessage { get; set; } = string.Empty;
    public List<RecoveryNutrientAdviceDto> NutrientsToReplenish { get; set; } = new();
    public List<RecommendedFoodDto> RecommendedFoods { get; set; } = new();
    public List<SuggestedComboDto> SuggestedCombos { get; set; } = new();
}
