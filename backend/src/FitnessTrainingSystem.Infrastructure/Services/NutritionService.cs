using FitnessTrainingSystem.Application.DTOs.Nutrition;
using FitnessTrainingSystem.Application.Interfaces;
using FitnessTrainingSystem.Domain.Entities;
using FitnessTrainingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace FitnessTrainingSystem.Infrastructure.Services;

public class NutritionService : INutritionService
{
    private readonly ApplicationDbContext _context;

    public NutritionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DailyNutritionSummaryDto> GetDailySummaryAsync(int userId, DateTime date, decimal? caloriesBurned = null)
    {
        var targetDate = date.Date;
        
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            try
            {
                var user = await _context.Users
                    .Include(u => u.BodyMetrics)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null) throw new Exception("User not found");

                var latestMetric = user.BodyMetrics.OrderByDescending(m => m.RecordedAt).FirstOrDefault();
                bool hasMetrics = latestMetric != null && latestMetric.Weight > 0;

                var fitnessGoal = "MAINTAIN";

                // Calculate targets
                int caloriesTarget = 2000; // default
                decimal proteinTarget = 150;
                decimal carbsTarget = 200;
                decimal fatTarget = 65;
                int waterTarget = 8;

                if (hasMetrics)
                {
                    int age = 25;
                    if (user.DateOfBirth.HasValue)
                    {
                        var today = DateTime.Today;
                        age = today.Year - user.DateOfBirth.Value.Year;
                        if (user.DateOfBirth.Value.Date > today.AddYears(-age)) age--;
                    }

                    decimal height = latestMetric!.Height ?? 170; // fallback height
                    decimal weight = latestMetric.Weight;

                    decimal bmr;
                    if (user.Gender == "Female" || user.Gender == "F")
                    {
                        bmr = (10 * weight) + (6.25m * height) - (5 * age) - 161;
                    }
                    else
                    {
                        bmr = (10 * weight) + (6.25m * height) - (5 * age) + 5;
                    }

                    decimal tdee = bmr * 1.55m;

                    if (fitnessGoal == "LOSE_WEIGHT") tdee -= 400;
                    if (fitnessGoal == "GAIN_MUSCLE") tdee += 400;

                    caloriesTarget = (int)Math.Round(tdee);

                    if (fitnessGoal == "LOSE_WEIGHT")
                    {
                        proteinTarget = weight * 2.2m;
                        fatTarget = (tdee * 0.3m) / 9m;
                        carbsTarget = (tdee - (proteinTarget * 4) - (fatTarget * 9)) / 4m;
                    }
                    else if (fitnessGoal == "GAIN_MUSCLE")
                    {
                        proteinTarget = weight * 2.0m;
                        fatTarget = (tdee * 0.25m) / 9m;
                        carbsTarget = (tdee - (proteinTarget * 4) - (fatTarget * 9)) / 4m;
                    }
                    else // MAINTAIN
                    {
                        proteinTarget = weight * 2.0m;
                        fatTarget = (tdee * 0.25m) / 9m;
                        carbsTarget = (tdee - (proteinTarget * 4) - (fatTarget * 9)) / 4m;
                    }

                    decimal waterMl = weight * 35;
                    waterTarget = (int)Math.Round(waterMl / 250m);
                }

                var log = await _context.Set<DailyNutritionLog>()
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.LogDate == targetDate);

                decimal effectiveBurned = 0;
                if (caloriesBurned.HasValue && caloriesBurned.Value > 0)
                {
                    effectiveBurned = caloriesBurned.Value;
                }
                else
                {
                    var nextDate = targetDate.AddDays(1);
                    var workouts = await _context.WorkoutSessions
                        .Where(w => w.UserId == userId && w.Status == "COMPLETED" && (
                            (w.CompletedAt.HasValue && w.CompletedAt.Value >= targetDate && w.CompletedAt.Value < nextDate) ||
                            (w.StartedAt.HasValue && w.StartedAt.Value >= targetDate && w.StartedAt.Value < nextDate)
                        ))
                        .ToListAsync();
                        
                    effectiveBurned = workouts.Sum(w => w.TotalCaloriesBurned ?? 0);

                    // Check if user completed workout today in UTC if targetDate matches today
                    if (effectiveBurned <= 0 && (targetDate == DateTime.UtcNow.Date || targetDate == DateTime.Today))
                    {
                        var utcToday = DateTime.UtcNow.Date;
                        var utcNext = utcToday.AddDays(1);
                        var recentWorkouts = await _context.WorkoutSessions
                            .Where(w => w.UserId == userId && w.Status == "COMPLETED" && (
                                (w.CompletedAt.HasValue && w.CompletedAt.Value >= utcToday && w.CompletedAt.Value < utcNext) ||
                                (w.StartedAt.HasValue && w.StartedAt.Value >= utcToday && w.StartedAt.Value < utcNext)
                            ))
                            .ToListAsync();
                        effectiveBurned = recentWorkouts.Sum(w => w.TotalCaloriesBurned ?? 0);
                    }
                }

                // If user has not worked out today, targets remain 0 until a workout is completed
                if (effectiveBurned <= 0)
                {
                    caloriesTarget = 0;
                    proteinTarget = 0;
                    carbsTarget = 0;
                    fatTarget = 0;
                }

                if (log == null)
                {
                    log = new DailyNutritionLog
                    {
                        UserId = userId,
                        LogDate = targetDate,
                        CaloriesTarget = caloriesTarget,
                        ProteinTargetGrams = proteinTarget,
                        CarbsTargetGrams = carbsTarget,
                        FatTargetGrams = fatTarget,
                        WaterTargetGlasses = waterTarget,
                        CaloriesConsumed = 0,
                        ProteinConsumedGrams = 0,
                        CarbsConsumedGrams = 0,
                        FatConsumedGrams = 0,
                        WaterConsumedGlasses = 0,
                        CaloriesBurned = effectiveBurned
                    };
                    _context.Set<DailyNutritionLog>().Add(log);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    log.CaloriesTarget = caloriesTarget;
                    log.ProteinTargetGrams = proteinTarget;
                    log.CarbsTargetGrams = carbsTarget;
                    log.FatTargetGrams = fatTarget;
                    log.WaterTargetGlasses = waterTarget;
                    log.CaloriesBurned = effectiveBurned;
                    await _context.SaveChangesAsync();
                }
                
                await transaction.CommitAsync();
                var recovery = await GetWorkoutRecoveryNutritionAsync(userId, effectiveBurned);
                var summary = MapToSummaryDto(log, hasMetrics, fitnessGoal, user, recovery);
                return summary;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    public async Task<DailyNutritionSummaryDto> LogWaterAsync(int userId, DateTime date, LogWaterDto dto)
    {
        var targetDate = date.Date;
        var strategy = _context.Database.CreateExecutionStrategy();
        
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            try
            {
                var log = await _context.Set<DailyNutritionLog>()
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.LogDate == targetDate);

                if (log == null)
                {
                    await transaction.RollbackAsync();
                    await GetDailySummaryAsync(userId, date);
                    return await LogWaterInternalAsync(userId, date, dto);
                }

                if (log != null)
                {
                    log.WaterConsumedGlasses += dto.Glasses;
                    if (log.WaterConsumedGlasses < 0) log.WaterConsumedGlasses = 0;
                    await _context.SaveChangesAsync();
                }

                var user = await _context.Users.Include(u => u.BodyMetrics).FirstOrDefaultAsync(u => u.Id == userId);
                bool hasMetrics = user?.BodyMetrics.Any() ?? false;
                string goal = "MAINTAIN";

                await transaction.CommitAsync();
                return MapToSummaryDto(log!, hasMetrics, goal, user);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }
    
    private async Task<DailyNutritionSummaryDto> LogWaterInternalAsync(int userId, DateTime date, LogWaterDto dto)
    {
        var targetDate = date.Date;
        using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        try
        {
            var log = await _context.Set<DailyNutritionLog>()
                .FirstOrDefaultAsync(l => l.UserId == userId && l.LogDate == targetDate);
                
            if (log != null)
            {
                log.WaterConsumedGlasses += dto.Glasses;
                if (log.WaterConsumedGlasses < 0) log.WaterConsumedGlasses = 0;
                await _context.SaveChangesAsync();
            }
            
            var user = await _context.Users.Include(u => u.BodyMetrics).FirstOrDefaultAsync(u => u.Id == userId);
            bool hasMetrics = user?.BodyMetrics.Any() ?? false;
            string goal = "MAINTAIN";

            await transaction.CommitAsync();
            return MapToSummaryDto(log!, hasMetrics, goal, user);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> UpdateReminderSettingsAsync(int userId, UpdateReminderSettingsDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        user.WaterReminderStartTime = dto.StartTime;
        user.WaterReminderEndTime = dto.EndTime;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DailyNutritionSummaryDto> LogFoodAsync(int userId, DateTime date, LogFoodDto dto)
    {
        var targetDate = date.Date;
        var food = await _context.Foods.FindAsync(dto.FoodId);
        if (food == null)
            throw new Exception("Food item not found.");

        var servings = dto.Servings <= 0 ? 1.0m : dto.Servings;
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            try
            {
                var log = await _context.Set<DailyNutritionLog>()
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.LogDate == targetDate);

                if (log == null)
                {
                    await transaction.RollbackAsync();
                    await GetDailySummaryAsync(userId, date);
                    return await LogFoodInternalAsync(userId, date, dto);
                }

                log.CaloriesConsumed += (int)Math.Round(food.Calories * servings);
                log.ProteinConsumedGrams += food.Protein * servings;
                log.CarbsConsumedGrams += food.Carbs * servings;
                log.FatConsumedGrams += food.Fat * servings;

                await _context.SaveChangesAsync();

                var user = await _context.Users.Include(u => u.BodyMetrics).FirstOrDefaultAsync(u => u.Id == userId);
                bool hasMetrics = user?.BodyMetrics.Any() ?? false;
                string goal = "MAINTAIN";

                var recovery = await GetWorkoutRecoveryNutritionAsync(userId, log.CaloriesBurned);
                await transaction.CommitAsync();

                var summary = MapToSummaryDto(log, hasMetrics, goal, user, recovery);
                return summary;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    private async Task<DailyNutritionSummaryDto> LogFoodInternalAsync(int userId, DateTime date, LogFoodDto dto)
    {
        var targetDate = date.Date;
        var food = await _context.Foods.FindAsync(dto.FoodId);
        if (food == null)
            throw new Exception("Food item not found.");

        var servings = dto.Servings <= 0 ? 1.0m : dto.Servings;
        using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        try
        {
            var log = await _context.Set<DailyNutritionLog>()
                .FirstOrDefaultAsync(l => l.UserId == userId && l.LogDate == targetDate);

            if (log != null)
            {
                log.CaloriesConsumed += (int)Math.Round(food.Calories * servings);
                log.ProteinConsumedGrams += food.Protein * servings;
                log.CarbsConsumedGrams += food.Carbs * servings;
                log.FatConsumedGrams += food.Fat * servings;
                await _context.SaveChangesAsync();
            }

            var user = await _context.Users.Include(u => u.BodyMetrics).FirstOrDefaultAsync(u => u.Id == userId);
            bool hasMetrics = user?.BodyMetrics.Any() ?? false;
            string goal = "MAINTAIN";

            var recovery = await GetWorkoutRecoveryNutritionAsync(userId, log?.CaloriesBurned ?? 0);
            await transaction.CommitAsync();

            return MapToSummaryDto(log!, hasMetrics, goal, user, recovery);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<WorkoutRecoveryNutritionDto> GetWorkoutRecoveryNutritionAsync(int userId, decimal? caloriesBurned)
    {
        decimal burned = caloriesBurned ?? 0;
        if (burned <= 0 && !caloriesBurned.HasValue)
        {
            var today = DateTime.UtcNow.Date;
            var todayWorkouts = await _context.WorkoutSessions
                .Where(w => w.UserId == userId && w.Status == "COMPLETED" && (
                    (w.CompletedAt.HasValue && w.CompletedAt.Value.Date == today) ||
                    (w.StartedAt.HasValue && w.StartedAt.Value.Date == today)
                ))
                .ToListAsync();

            burned = todayWorkouts.Sum(w => w.TotalCaloriesBurned ?? 0);
        }

        decimal effectiveBurned = burned;
        int recommendedReplenish = burned > 0 ? (int)Math.Round(effectiveBurned * 0.5m) : 0;
        if (burned > 0)
        {
            if (recommendedReplenish < 200) recommendedReplenish = 200;
            if (recommendedReplenish > 650) recommendedReplenish = 650;
        }

        int proteinGrams = (int)Math.Max(20, Math.Min(40, Math.Round((burned > 0 ? burned : 300m) * 0.08m)));
        int carbsGrams = (int)Math.Max(30, Math.Min(65, Math.Round((burned > 0 ? burned : 300m) * 0.12m)));

        var guidance = burned > 0
            ? $"Bạn đã đốt cháy {burned:N0} kcal qua buổi tập! Khoảng thời gian 30 - 60 phút sau tập là 'thời điểm vàng' để cơ thể hấp thu dưỡng chất tốt nhất. Bạn nên nạp khoảng {recommendedReplenish} kcal phục hồi gồm đạm nạc để sửa chữa sợi cơ và tinh bột lành mạnh để tái tạo glycogen dự trữ."
            : "Hôm nay bạn chưa ghi nhận buổi tập nào. Hãy duy trì chế độ dinh dưỡng cân bằng theo mục tiêu và uống đủ nước. Gợi ý phục hồi theo lượng calo đốt cháy sẽ tự động kích hoạt sau khi bạn hoàn thành buổi tập!";

        var nutrientAdvice = burned > 0
            ? new List<RecoveryNutrientAdviceDto>
            {
                new()
                {
                    Nutrient = "Protein (Đạm phục hồi cơ)",
                    TargetAmount = $"{proteinGrams - 5} - {proteinGrams + 5}g",
                    Purpose = "Kích thích tổng hợp protein cơ bắp (MPS), sửa chữa các vi tổn thương sợi cơ sau vận động và ngăn ngừa dị hóa cơ.",
                    Priority = "Cao",
                    BestFoodSources = "Ức gà nướng, Cá hồi, Cá ngừ, Whey Protein, Lòng trắng trứng"
                },
                new()
                {
                    Nutrient = "Carbohydrates (Tinh bột nạp Glycogen)",
                    TargetAmount = $"{carbsGrams - 5} - {carbsGrams + 5}g",
                    Purpose = "Tái tạo kho dự trữ Glycogen trong cơ bắp và gan đã tiêu hao trong khi tập, hạ cortisol và phục hồi thể lực tức thì.",
                    Priority = "Cao",
                    BestFoodSources = "Chuối, Khoai lang, Yến mạch, Cơm gạo lứt, Bánh mì nguyên cám"
                },
                new()
                {
                    Nutrient = "Nước & Khoáng điện giải",
                    TargetAmount = burned > 300 ? "500 - 750 ml (2-3 ly)" : "350 - 500 ml (1-2 ly)",
                    Purpose = "Bù đắp thể tích tuần hoàn và ion Natri, Kali mất theo mồ hôi, chống chuột rút và giảm đau mỏi cơ.",
                    Priority = "Cao",
                    BestFoodSources = "Nước lọc khoáng, Nước dừa tự nhiên, Chuối, Cam, Dưa chuột"
                },
                new()
                {
                    Nutrient = "Chất béo tốt & Kháng viêm",
                    TargetAmount = "8 - 15g",
                    Purpose = "Cung cấp Omega-3 và chất béo không bão hòa đơn hỗ trợ làm dịu phản ứng viêm mô cơ và bảo vệ tế bào.",
                    Priority = "Trung bình",
                    BestFoodSources = "Quả bơ, Hạnh nhân, Cá hồi nướng, Dầu ô liu, Bơ đậu phộng"
                }
            }
            : new List<RecoveryNutrientAdviceDto>();

        var foodsFromDb = await _context.Foods.AsNoTracking().ToListAsync();
        var recommendedFoods = new List<RecommendedFoodDto>();

        foreach (var f in foodsFromDb)
        {
            var category = "Vitamins";
            var categoryLabel = "Bù nước, khoáng & Vitamin";
            var benefit = "Giàu vi chất, hỗ trợ giải nhiệt và giảm mỏi cơ.";

            string lower = f.Name.ToLower();

            if (f.Protein >= 15 || lower.Contains("protein") || lower.Contains("chicken") || lower.Contains("salmon") || lower.Contains("tuna") || lower.Contains("beef") || lower.Contains("pork") || lower.Contains("shrimp") || lower.Contains("egg") || lower.Contains("yogurt") || lower.Contains("cheese"))
            {
                category = "Protein";
                categoryLabel = "Đạm cao phục hồi cơ";
                benefit = "Cung cấp chuỗi axit amin thiết yếu (BCAA) giúp phục hồi sợi cơ bị tổn thương cực nhanh.";
            }
            else if (f.Carbs >= 15 || lower.Contains("rice") || lower.Contains("oatmeal") || lower.Contains("potato") || lower.Contains("bread") || lower.Contains("banana"))
            {
                category = "Carbs";
                categoryLabel = "Nạp năng lượng Glycogen";
                benefit = "Bổ sung tinh bột hấp thu nhanh và chậm, tái tạo năng lượng cho các khối cơ hoạt động.";
            }
            else if (lower.Contains("avocado") || lower.Contains("almond") || lower.Contains("peanut") || lower.Contains("oil"))
            {
                category = "HealthyFat";
                categoryLabel = "Chất béo tốt & Kháng viêm";
                benefit = "Chứa chất béo không bão hòa và Vitamin E giúp làm dịu viêm sưng và bảo vệ khớp cơ.";
            }
            else if (lower.Contains("broccoli") || lower.Contains("spinach") || lower.Contains("orange") || lower.Contains("apple") || lower.Contains("tomato") || lower.Contains("cucumber") || lower.Contains("asparagus") || lower.Contains("mushroom"))
            {
                category = "Vitamins";
                categoryLabel = "Bù nước, khoáng & Vitamin";
                benefit = "Chứa nhiều Kali, Vitamin C và nước tự nhiên giúp bù điện giải và chống co thắt cơ.";
            }

            var img = !string.IsNullOrWhiteSpace(f.ImageUrl) ? f.ImageUrl : GetFoodImageFallback(f.Name);

            recommendedFoods.Add(new RecommendedFoodDto
            {
                Id = f.Id,
                Name = f.Name,
                ServingSize = f.ServingSize,
                Unit = f.Unit,
                Calories = f.Calories,
                Protein = f.Protein,
                Carbs = f.Carbs,
                Fat = f.Fat,
                ImageUrl = img,
                Category = category,
                CategoryLabel = categoryLabel,
                RecoveryBenefit = benefit
            });
        }

        if (burned <= 0)
        {
            return new WorkoutRecoveryNutritionDto
            {
                CaloriesBurned = 0,
                RecommendedReplenishCalories = 0,
                GuidanceMessage = "Hôm nay bạn chưa có buổi tập nào. Hãy hoàn thành buổi tập để nhận gợi ý dinh dưỡng phục hồi và combo thực đơn cho các bữa ăn!",
                NutrientsToReplenish = new(),
                RecommendedFoods = recommendedFoods,
                SuggestedCombos = new()
            };
        }

        var combos = new List<SuggestedComboDto>();

        // Lấy các nguyên liệu từ DB Foods theo nhóm
        var oats = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Oat") || x.Name.Contains("Bread")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Carbs");
        var egg = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Egg")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Protein");
        var banana = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Banana")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Carbs");
        var chicken = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Chicken")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Protein");
        var sweetPotato = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Sweet Potato") || x.Name.Contains("Rice")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Carbs");
        var broccoli = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Broccoli") || x.Name.Contains("Spinach")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Vitamins");
        var salmon = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Salmon") || x.Name.Contains("Fish") || x.Name.Contains("Tuna")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Protein");
        var brownRice = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Brown Rice") || x.Name.Contains("Rice")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Carbs");
        var spinach = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Spinach") || x.Name.Contains("Broccoli")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Vitamins");
        var avocado = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Avocado") || x.Name.Contains("Almond")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "HealthyFat");
        var whey = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Whey")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Protein");
        var beef = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Beef") || x.Name.Contains("Pork")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Protein");
        var whiteRice = recommendedFoods.FirstOrDefault(x => x.Name.Contains("White Rice") || x.Name.Contains("Rice")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Carbs");
        var yogurt = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Greek Yogurt") || x.Name.Contains("Yogurt")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Protein");
        var almonds = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Almonds") || x.Name.Contains("Peanut")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "HealthyFat");
        var apple = recommendedFoods.FirstOrDefault(x => x.Name.Contains("Apple") || x.Name.Contains("Banana")) ?? recommendedFoods.FirstOrDefault(x => x.Category == "Carbs");

        // ════════════════════════════════════════════════════════════════
        // COMBO 1: THỰC ĐƠN CẢ NGÀY - PHỤC HỒI & TĂNG CƠ NẠC (4 BỮA)
        // ════════════════════════════════════════════════════════════════
        var c1Meals = new List<SuggestedMealSectionDto>();

        // 1.1 Sáng
        var c1BfFoods = new List<RecommendedFoodDto>();
        if (oats != null) c1BfFoods.Add(oats);
        if (egg != null) c1BfFoods.Add(egg);
        if (banana != null) c1BfFoods.Add(banana);
        if (c1BfFoods.Any())
        {
            c1Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Breakfast",
                MealTitle = "Bữa Sáng: Yến Mạch, Trứng Gà & Chuối",
                Calories = c1BfFoods.Sum(f => f.Calories),
                Protein = c1BfFoods.Sum(f => f.Protein),
                Carbs = c1BfFoods.Sum(f => f.Carbs),
                Fat = c1BfFoods.Sum(f => f.Fat),
                Foods = c1BfFoods
            });
        }

        // 1.2 Trưa
        var c1LnFoods = new List<RecommendedFoodDto>();
        if (chicken != null) c1LnFoods.Add(chicken);
        if (sweetPotato != null) c1LnFoods.Add(sweetPotato);
        if (broccoli != null) c1LnFoods.Add(broccoli);
        if (c1LnFoods.Any())
        {
            c1Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Lunch",
                MealTitle = "Bữa Trưa: Ức Gà Áp Chảo, Khoai Lang & Bông Cải",
                Calories = c1LnFoods.Sum(f => f.Calories),
                Protein = c1LnFoods.Sum(f => f.Protein),
                Carbs = c1LnFoods.Sum(f => f.Carbs),
                Fat = c1LnFoods.Sum(f => f.Fat),
                Foods = c1LnFoods
            });
        }

        // 1.3 Tối
        var c1DnFoods = new List<RecommendedFoodDto>();
        if (salmon != null) c1DnFoods.Add(salmon);
        if (brownRice != null) c1DnFoods.Add(brownRice);
        if (spinach != null) c1DnFoods.Add(spinach);
        if (avocado != null) c1DnFoods.Add(avocado);
        if (c1DnFoods.Any())
        {
            c1Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Dinner",
                MealTitle = "Bữa Tối: Cá Hồi Áp Chảo, Cơm Gạo Lứt, Rau Bina & Bơ",
                Calories = c1DnFoods.Sum(f => f.Calories),
                Protein = c1DnFoods.Sum(f => f.Protein),
                Carbs = c1DnFoods.Sum(f => f.Carbs),
                Fat = c1DnFoods.Sum(f => f.Fat),
                Foods = c1DnFoods
            });
        }

        // 1.4 Bữa Phụ Sau Tập
        var c1SnFoods = new List<RecommendedFoodDto>();
        if (whey != null) c1SnFoods.Add(whey);
        if (banana != null) c1SnFoods.Add(banana);
        if (c1SnFoods.Any())
        {
            c1Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Snack",
                MealTitle = "Bữa Phụ: Whey Protein & Chuối Phục Hồi Cơ",
                Calories = c1SnFoods.Sum(f => f.Calories),
                Protein = c1SnFoods.Sum(f => f.Protein),
                Carbs = c1SnFoods.Sum(f => f.Carbs),
                Fat = c1SnFoods.Sum(f => f.Fat),
                Foods = c1SnFoods
            });
        }

        var c1AllFoods = c1Meals.SelectMany(m => m.Foods).ToList();
        if (c1Meals.Any())
        {
            combos.Add(new SuggestedComboDto
            {
                Title = "Combo Toàn Diện: Tăng Cơ & Phục Hồi Thể Lực (Thực Đơn Cả Ngày)",
                MealType = "FullDay",
                TargetGoal = "Phục hồi & Tăng cơ nạc",
                Description = "Thực đơn dinh dưỡng chuẩn hóa cho cả ngày gồm 4 bữa (Sáng, Trưa, Tối, Phụ sau tập) cân đối đầy đủ calo, đạm tinh khiết, tinh bột hấp thu chậm và chất béo lành mạnh.",
                TotalCalories = c1Meals.Sum(m => m.Calories),
                TotalProtein = c1Meals.Sum(m => m.Protein),
                TotalCarbs = c1Meals.Sum(m => m.Carbs),
                TotalFat = c1Meals.Sum(m => m.Fat),
                Foods = c1AllFoods,
                Meals = c1Meals
            });
        }

        // ════════════════════════════════════════════════════════════════
        // COMBO 2: THỰC ĐƠN CẢ NGÀY - NĂNG LƯỢNG CAO & PHÁT TRIỂN SỨC MẠNH (4 BỮA)
        // ════════════════════════════════════════════════════════════════
        var c2Meals = new List<SuggestedMealSectionDto>();

        // 2.1 Sáng
        var c2BfFoods = new List<RecommendedFoodDto>();
        if (egg != null) c2BfFoods.Add(egg);
        if (oats != null) c2BfFoods.Add(oats);
        if (apple != null) c2BfFoods.Add(apple);
        if (c2BfFoods.Any())
        {
            c2Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Breakfast",
                MealTitle = "Bữa Sáng: Trứng Ốp La, Bánh Mì Yến Mạch & Táo",
                Calories = c2BfFoods.Sum(f => f.Calories),
                Protein = c2BfFoods.Sum(f => f.Protein),
                Carbs = c2BfFoods.Sum(f => f.Carbs),
                Fat = c2BfFoods.Sum(f => f.Fat),
                Foods = c2BfFoods
            });
        }

        // 2.2 Trưa
        var c2LnFoods = new List<RecommendedFoodDto>();
        if (beef != null) c2LnFoods.Add(beef);
        if (whiteRice != null) c2LnFoods.Add(whiteRice);
        if (broccoli != null) c2LnFoods.Add(broccoli);
        if (c2LnFoods.Any())
        {
            c2Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Lunch",
                MealTitle = "Bữa Trưa: Bò Nạc Xào, Cơm Trắng & Bông Cải Xanh",
                Calories = c2LnFoods.Sum(f => f.Calories),
                Protein = c2LnFoods.Sum(f => f.Protein),
                Carbs = c2LnFoods.Sum(f => f.Carbs),
                Fat = c2LnFoods.Sum(f => f.Fat),
                Foods = c2LnFoods
            });
        }

        // 2.3 Tối
        var c2DnFoods = new List<RecommendedFoodDto>();
        if (chicken != null) c2DnFoods.Add(chicken);
        if (brownRice != null) c2DnFoods.Add(brownRice);
        if (spinach != null) c2DnFoods.Add(spinach);
        if (c2DnFoods.Any())
        {
            c2Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Dinner",
                MealTitle = "Bữa Tối: Ức Gà Nướng, Cơm Gạo Lứt & Rau Bina",
                Calories = c2DnFoods.Sum(f => f.Calories),
                Protein = c2DnFoods.Sum(f => f.Protein),
                Carbs = c2DnFoods.Sum(f => f.Carbs),
                Fat = c2DnFoods.Sum(f => f.Fat),
                Foods = c2DnFoods
            });
        }

        // 2.4 Bữa Phụ
        var c2SnFoods = new List<RecommendedFoodDto>();
        if (yogurt != null) c2SnFoods.Add(yogurt);
        if (almonds != null) c2SnFoods.Add(almonds);
        if (c2SnFoods.Any())
        {
            c2Meals.Add(new SuggestedMealSectionDto
            {
                MealType = "Snack",
                MealTitle = "Bữa Phụ: Sữa Chua Hy Lạp & Hạnh Nhân Hạt",
                Calories = c2SnFoods.Sum(f => f.Calories),
                Protein = c2SnFoods.Sum(f => f.Protein),
                Carbs = c2SnFoods.Sum(f => f.Carbs),
                Fat = c2SnFoods.Sum(f => f.Fat),
                Foods = c2SnFoods
            });
        }

        var c2AllFoods = c2Meals.SelectMany(m => m.Foods).ToList();
        if (c2Meals.Any())
        {
            combos.Add(new SuggestedComboDto
            {
                Title = "Combo Năng Lượng: Tăng Sức Mạnh & Bền Bỉ (Thực Đơn Cả Ngày)",
                MealType = "FullDay",
                TargetGoal = "Sức mạnh & Tăng cơ",
                Description = "Thực đơn năng lượng cao với nguồn creatine tự nhiên từ thịt bò nạc, đạm chất lượng từ sữa chua Hy Lạp và chất béo tốt bảo vệ khớp xương.",
                TotalCalories = c2Meals.Sum(m => m.Calories),
                TotalProtein = c2Meals.Sum(m => m.Protein),
                TotalCarbs = c2Meals.Sum(m => m.Carbs),
                TotalFat = c2Meals.Sum(m => m.Fat),
                Foods = c2AllFoods,
                Meals = c2Meals
            });
        }

        return new WorkoutRecoveryNutritionDto
        {
            CaloriesBurned = burned,
            RecommendedReplenishCalories = recommendedReplenish,
            GuidanceMessage = guidance,
            NutrientsToReplenish = nutrientAdvice,
            RecommendedFoods = recommendedFoods,
            SuggestedCombos = combos
        };
    }

    private static string GetFoodImageFallback(string foodName)
    {
        var lower = foodName.ToLower();
        if (lower.Contains("chicken")) return "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("salmon")) return "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("tuna")) return "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("beef")) return "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("pork")) return "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("shrimp")) return "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("whey")) return "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("egg")) return "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("yogurt")) return "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("cheese")) return "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("milk")) return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("oat")) return "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("sweet potato") || lower.Contains("potato")) return "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("brown rice") || lower.Contains("rice")) return "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("bread")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("banana")) return "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("avocado")) return "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("almond") || lower.Contains("peanut")) return "https://images.unsplash.com/photo-1508061252445-8450f65604da?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("broccoli")) return "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("spinach") || lower.Contains("salad")) return "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("apple")) return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("orange")) return "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("tomato")) return "https://images.unsplash.com/photo-1546470427-227c7369a9e8?w=400&auto=format&fit=crop&q=80";
        if (lower.Contains("cucumber")) return "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&auto=format&fit=crop&q=80";
        return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&auto=format&fit=crop&q=80";
    }

    private DailyNutritionSummaryDto MapToSummaryDto(DailyNutritionLog log, bool hasMetrics, string fitnessGoal, User? user, WorkoutRecoveryNutritionDto? recovery = null)
    {
        int netCalories = log.CaloriesConsumed - (int)log.CaloriesBurned;
        int calRemaining = log.CaloriesTarget > 0 ? Math.Max(0, log.CaloriesTarget - netCalories) : 0;

        int GetPercent(decimal current, decimal target)
        {
            if (target <= 0) return 0;
            int pct = (int)Math.Round((current / target) * 100);
            return pct > 100 ? 100 : pct;
        }

        return new DailyNutritionSummaryDto
        {
            Date = log.LogDate,
            CaloriesTarget = log.CaloriesTarget,
            CaloriesConsumed = log.CaloriesConsumed,
            CaloriesBurned = log.CaloriesBurned,
            CaloriesRemaining = calRemaining,
            NetCalories = netCalories,

            Protein = new MacroSummaryDto
            {
                CurrentGrams = Math.Round(log.ProteinConsumedGrams, 1),
                TargetGrams = Math.Round(log.ProteinTargetGrams, 1),
                Percentage = GetPercent(log.ProteinConsumedGrams, log.ProteinTargetGrams)
            },
            Carbs = new MacroSummaryDto
            {
                CurrentGrams = Math.Round(log.CarbsConsumedGrams, 1),
                TargetGrams = Math.Round(log.CarbsTargetGrams, 1),
                Percentage = GetPercent(log.CarbsConsumedGrams, log.CarbsTargetGrams)
            },
            Fat = new MacroSummaryDto
            {
                CurrentGrams = Math.Round(log.FatConsumedGrams, 1),
                TargetGrams = Math.Round(log.FatTargetGrams, 1),
                Percentage = GetPercent(log.FatConsumedGrams, log.FatTargetGrams)
            },

            WaterTargetGlasses = log.WaterTargetGlasses,
            WaterConsumedGlasses = log.WaterConsumedGlasses,

            HasBodyMetrics = hasMetrics,
            FitnessGoal = fitnessGoal,

            WaterReminderStartTime = user?.WaterReminderStartTime,
            WaterReminderEndTime = user?.WaterReminderEndTime,
            WorkoutRecovery = recovery
        };
    }
}
