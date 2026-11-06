using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using FitnessTrainingSystem.Application.DTOs.Workouts;
using FitnessTrainingSystem.Application.Interfaces;
using FitnessTrainingSystem.Application.DTOs.Exercises;

namespace FitnessTrainingSystem.Application.Features.AiRecommendations.Commands.GenerateWeeklyWorkoutPlan;

public class GenerateWeeklyWorkoutPlanCommandHandler : IRequestHandler<GenerateWeeklyWorkoutPlanCommand, AiWeeklyWorkoutPlanResponseDto>
{
    private readonly IExerciseService _exerciseService;
    private readonly IProductPackageService _packageService;

    public GenerateWeeklyWorkoutPlanCommandHandler(IExerciseService exerciseService, IProductPackageService packageService)
    {
        _exerciseService = exerciseService;
        _packageService = packageService;
    }

    public async Task<AiWeeklyWorkoutPlanResponseDto> Handle(GenerateWeeklyWorkoutPlanCommand request, CancellationToken cancellationToken)
    {
        var hasHighestTier = await _packageService.HasHighestTierPackageAsync(request.UserId);
        if (!hasHighestTier)
        {
            throw new UnauthorizedAccessException("Bạn cần đăng ký gói thành viên cao cấp nhất để sử dụng tính năng tư vấn bài tập nguyên tuần.");
        }

        var allExercises = (await _exerciseService.GetAllAsync()).ToList();
        if (!allExercises.Any())
        {
            throw new Exception("Không có bài tập nào khả dụng trong hệ thống.");
        }

        // Parse injured muscle groups (e.g., "Legs (Severity 3/5), Shoulders" -> ["leg", "shoulder", ...])
        var injuredKeywords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(request.InjuredMuscleGroups))
        {
            var parts = request.InjuredMuscleGroups.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var part in parts)
            {
                var clean = part.Split('(')[0].Trim().ToLower();
                if (!string.IsNullOrEmpty(clean))
                {
                    injuredKeywords.Add(clean);
                }
            }
        }

        bool IsMuscleInjured(string? muscleName)
        {
            if (string.IsNullOrEmpty(muscleName)) return false;
            var lower = muscleName.ToLower();
            return injuredKeywords.Any(k => lower.Contains(k) || k.Contains(lower));
        }

        // Standard Weekly Split Templates
        var splitTemplates = new List<(string Title, string Description, string DefaultMuscle, string[] TargetMuscles)>
        {
            ("Thứ 2: Ngực & Tay sau (Chest & Triceps)", "Tập trung phát triển nhóm cơ ngực và tay sau với các bài đẩy hiệu quả.", "Chest", new[] { "Chest", "Arms" }),
            ("Thứ 3: Lưng & Tay trước (Back & Biceps)", "Tăng cường sức mạnh lưng xô và bắp tay trước, cải thiện tư thế.", "Back", new[] { "Back", "Arms" }),
            ("Thứ 4: Chân & Mông (Legs & Lower Body)", "Tập luyện sức mạnh thân dưới, phát triển đùi trước, đùi sau và mông.", "Legs", new[] { "Legs" }),
            ("Thứ 5: Vai & Cơ bụng (Shoulders & Core)", "Xây dựng bờ vai săn chắc kết hợp siết cơ bụng định hình cơ thể.", "Shoulders", new[] { "Shoulders", "Core" }),
            ("Thứ 6: Toàn thân & Cardio (Full Body Burn)", "Kích hoạt toàn bộ các nhóm cơ và nâng cao sức bền tim mạch.", "Full Body", new[] { "Full Body", "Core" })
        };

        int dayCount = request.Frequency > 0 ? Math.Clamp(request.Frequency, 3, 5) : 5;
        var selectedTemplates = splitTemplates.Take(dayCount).ToList();

        // Warmup exercises available
        var warmupExercises = allExercises.Where(e =>
            e.Title.Contains("warm", StringComparison.OrdinalIgnoreCase) ||
            e.Title.Contains("khởi động", StringComparison.OrdinalIgnoreCase) ||
            e.Title.Contains("stretch", StringComparison.OrdinalIgnoreCase) ||
            e.Title.Contains("giãn", StringComparison.OrdinalIgnoreCase)
        ).ToList();

        var weeklyDays = new List<WorkoutPlanOutput>();
        int dayIndex = 0;

        foreach (var tpl in selectedTemplates)
        {
            dayIndex++;
            var dayTitle = tpl.Title;
            var dayDesc = tpl.Description;
            var targetMuscles = tpl.TargetMuscles.Where(m => !IsMuscleInjured(m)).ToArray();

            // If all target muscles for this day are injured, adapt to active recovery
            bool isAllInjured = targetMuscles.Length == 0;
            if (isAllInjured)
            {
                dayTitle = $"Thứ {dayIndex + 1}: Phục hồi & Giãn cơ (Active Recovery)";
                dayDesc = "Tập các bài kéo giãn nhẹ nhàng và phục hồi chức năng, tránh tác động vào vùng chấn thương.";
                targetMuscles = new[] { "Full Body", "Core" };
            }

            // Pick warmup exercise (avoiding injured muscles)
            var warmup = warmupExercises
                .Where(w => !IsMuscleInjured(w.MuscleGroup))
                .OrderBy(_ => Guid.NewGuid())
                .FirstOrDefault();

            // Pick 4-5 main exercises for this day
            int exercisesToTake = warmup != null ? 4 : 5;
            var candidateExercises = allExercises
                .Where(e => warmup == null || e.Id != warmup.Id)
                .Where(e => !IsMuscleInjured(e.MuscleGroup))
                .Where(e => targetMuscles.Any(tm => string.Equals(e.MuscleGroup, tm, StringComparison.OrdinalIgnoreCase)))
                .OrderBy(_ => Guid.NewGuid())
                .Take(exercisesToTake)
                .ToList();

            // If not enough, fill with non-injured Full Body or Core exercises
            if (candidateExercises.Count < exercisesToTake)
            {
                var currentIds = candidateExercises.Select(x => x.Id).ToHashSet();
                if (warmup != null) currentIds.Add(warmup.Id);

                var fallbackExercises = allExercises
                    .Where(e => !currentIds.Contains(e.Id) && !IsMuscleInjured(e.MuscleGroup))
                    .OrderBy(_ => Guid.NewGuid())
                    .Take(exercisesToTake - candidateExercises.Count);

                candidateExercises.AddRange(fallbackExercises);
            }

            var finalExercisesForDay = new List<ExerciseDto>();
            if (warmup != null)
            {
                finalExercisesForDay.Add(warmup);
            }
            finalExercisesForDay.AddRange(candidateExercises);

            var exerciseItems = new List<ExerciseItemOutput>();
            int order = 1;
            decimal dayCalories = 0;
            int dayDuration = 0;

            foreach (var ex in finalExercisesForDay)
            {
                int sets = 3;
                int reps = 12;
                int durationSecs = 60;
                int restSecs = 30;
                int exDurationMins = (durationSecs + restSecs) * sets / 60;
                decimal caloriesBurnPerMin = 5.0m;
                decimal calsBurned = exDurationMins * caloriesBurnPerMin;

                exerciseItems.Add(new ExerciseItemOutput
                {
                    ExerciseId = ex.Id,
                    ExerciseTitle = ex.Title,
                    Sets = sets,
                    Reps = reps,
                    DurationSeconds = durationSecs,
                    RestSeconds = restSecs,
                    ExerciseOrder = order++,
                    CaloriesBurned = calsBurned
                });

                dayCalories += calsBurned;
                dayDuration += exDurationMins;
            }

            weeklyDays.Add(new WorkoutPlanOutput
            {
                Title = dayTitle,
                Goal = dayDesc,
                TargetDurationMinutes = dayDuration > 0 ? dayDuration : (request.DurationMinutesPerDay > 0 ? request.DurationMinutesPerDay : 45),
                TargetCalories = dayCalories > 0 ? dayCalories : (request.TargetCaloriesPerDay > 0 ? request.TargetCaloriesPerDay : 300),
                Exercises = exerciseItems
            });
        }

        return new AiWeeklyWorkoutPlanResponseDto
        {
            Success = true,
            UserId = request.UserId,
            Model = "RuleBased-WeeklyEngine",
            Recommendation = new WeeklyWorkoutPlanOutput
            {
                Days = weeklyDays
            }
        };
    }
}
