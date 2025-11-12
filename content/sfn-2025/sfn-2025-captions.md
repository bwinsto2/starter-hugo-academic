---
title: "Figure captions for poster: Context-Dependent Effects of Psilocybin on Temporal Brain Dynamics in Humans"
date: 2025-11-08
draft: false
slug: "captions"
---

# Figure 1 — Psilocybin reduces TA across the brain during rest but not music listening 

Lag-1 temporal autocorrelation (TA) was measured over the entire resting state and music listening scans at each voxel of the brain. Voxelwise TA was averaged within each of 400 parcels in the Schaefer parcellation and projected to the cortical surface. 

ΔTA: for each parcel we generated 10,000 null samples by randomly flipping the sign of each subject’s ΔTA, recomputed the group mean ΔTA for the parcel, and used the empirical null to obtain a two‑sided p‑value. P-values were then FDR corrected (a = 0.05). q < 0.05 in 361/400 parcels for the resting state scan, and q < 0.05 in 0 parcels for the musc listening scan. 

# Figure 2 – Psilocybin effects on TA are blocked when brain regions entrain to music 

Intersubject Pattern Correlation (pISC) in each parcel was measured as the average correlation between the multivoxel pattern within each 5 TR (11s) window for each pair of subjects, averaged across all subjects and windows. The parcels with the 20 highest pISC values were designated "Music Parcels". 

Split violin plots show the distribution of TA change between drug conditions during rest (left) and music listening (right) in the 20 Music parcels (blue) and the 380 Other parcels. 

We hypothesized that the TA change between Other parcels and Music parcels would be >0 in music listening but not rest. We ran a Monte Carlo simulation in which the test statistic was the mean TA change in Other parcels - mean TA change in Music parcels. For each iteration of the null distribution, we selected 20 parcels at random to be the Music parcels and re-computed the test statistic. We performed this test once for each task: rest and music. The difference was significant in music (p<0.001) but not rest (p=0.1).


# Figure 3 – Psilocybin disproportionately disrupts slow dynamics during rest but not music
Parcel scatterplot (Placebo vs Psilocybin TA): For rest (blue) and music listening scans (orange) each point is plotted such that x = Placebo TA and y = Psilocybin TA. Not only is TA overall lower in the psilocybin condition, but this effect is strongest in parcels with high TA in the placebo condition. 

Blomqvist sensitivity sweep: To test association between ΔTA (Psilocybin − Placebo) and Placebo (baseline) TA, we first fit an OLS slope β_crude from the regression ΔTA ~ BaselineTA across parcels. Such regressions are biased in the negative direction (see Chiolero 2013), so we applied the Blomqvist adjustment to correct the slope and its SE under different assumed baseline intraclass correlations (ICC). Specifically, for each ICC in a prespecified sweep (0.95, 0.90, …, 0.50) we computed the adjusted slope β_adj. During rest, for every ICC tested, β_adj was <-0.3, which suggests that ΔTA was greater in high TA regions at baseline. In contrast, during music listening, β_adj could be positive or negative depending on ICC, which suggests there is no association between ΔTA and baseline TA during music listening. 
