import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib import cm
from matplotlib.colors import Normalize
from scipy.stats import zscore

# --- Data Generation Function ---
def generate_player_data(n_players=100, seed=1903):
    np.random.seed(seed)
    true_skill = np.random.normal(loc=6.8, scale=0.4, size=n_players)
    performance_noise = np.random.normal(loc=0, scale=1.0, size=(n_players, 2))
    ratings = true_skill.reshape(-1, 1) + performance_noise
    ratings = np.clip(ratings, 3, 10)

    df = pd.DataFrame({
        'Player': [f'Player {i+1}' for i in range(n_players)],
        'true_skill': true_skill,
        'rating_fh': ratings[:, 0],
        'rating_sh': ratings[:, 1]
    })

    df['z_fh'] = zscore(df['rating_fh'])
    df['z_sh'] = zscore(df['rating_sh'])
    df['abs_z_fh'] = df['z_fh'].abs()
    df['abs_z_sh'] = df['z_sh'].abs()
    
    return df

# --- Grouping Function ---
def get_groups(df, base_col, compare_col, z_col, abs_z_col):
    best = df.nlargest(10, z_col).copy()
    worst = df.nsmallest(10, z_col).copy()
    avg = df.nsmallest(10, abs_z_col).copy()
    for group in [best, worst, avg]:
        group.rename(columns={base_col: 'Base Rating', compare_col: 'Compare Rating'}, inplace=True)
        group['regression'] = group['Compare Rating'] - group['Base Rating']
    return best, worst, avg

# --- Legend Helper ---
def make_legend(best, avg, worst):
    return [
        mpatches.Patch(color='green', label=f'Best Performers: {best["regression"].mean():.2f}'),
        mpatches.Patch(color='blue', label=f'Average Performers: {avg["regression"].mean():.2f}'),
        mpatches.Patch(color='red', label=f'Worst Performers: {worst["regression"].mean():.2f}'),
        mpatches.Patch(color='gray', label='Population Mean')
    ]

# --- Arrow Plotter ---
def plot_custom_arrows(ax, group, perspective='fh', reveal_other_half=True, cmap=cm.Blues, norm=None):
    jitter = np.linspace(-0.2, 0.2, len(group))
    for i, (_, row) in enumerate(group.iterrows()):
        tone = norm(row['true_skill']) if norm else 0.5
        color = cmap(tone)
        if perspective == 'fh':
            x_focus, y_focus = 1 + jitter[i], row['Base Rating']
            x_other, y_other = 2 + jitter[i], row['Compare Rating']
        elif perspective == 'sh':
            x_focus, y_focus = 2 + jitter[i], row['Base Rating']
            x_other, y_other = 1 + jitter[i], row['Compare Rating']
        else:
            raise ValueError("Perspective must be 'fh' or 'sh'")
        ax.plot(x_focus, y_focus, 'o', color=color, markersize=7, alpha=0.8)
        if reveal_other_half:
            ax.annotate("", xy=(x_other, y_other), xytext=(x_focus, y_focus),
                        arrowprops=dict(arrowstyle="->", color=color, lw=2, alpha=0.9))
    ax.set_xticks([1, 2])
    ax.set_xticklabels(['First Half', 'Second Half'], fontsize=13)
    ax.set_xlim(0.7, 2.5)
    ax.set_ylim(3, 10)
    ax.set_ylabel('Match Rating', fontsize=13)
    ax.grid(True, linestyle='--', alpha=0.4)

# --- Dot Plotter ---
def plot_custom_dots(ax, group, perspective='fh', reveal_other_half=True, cmap=cm.Blues, norm=None):
    jitter = np.linspace(-0.15, 0.15, len(group))
    tones = group['true_skill'].apply(norm).values if norm else np.full(len(group), 0.5)
    colors = [cmap(t) for t in tones]
    if perspective == 'fh':
        focus_x, focus_ratings = 1 + jitter, group['Base Rating']
        other_x, other_ratings = 2 + jitter, group['Compare Rating']
    elif perspective == 'sh':
        focus_x, focus_ratings = 2 + jitter, group['Base Rating']
        other_x, other_ratings = 1 + jitter, group['Compare Rating']
    else:
        raise ValueError("Perspective must be either 'fh' or 'sh'")
    ax.scatter(focus_x, focus_ratings, color=colors, s=70, marker='o')
    if reveal_other_half:
        ax.scatter(other_x, other_ratings, color=colors, s=70, marker='x')
    ax.set_xticks([1, 2])
    ax.set_xticklabels(['First Half', 'Second Half'], fontsize=13)
    ax.set_xlim(0.7, 2.3)
    ax.set_ylim(3, 10)
    ax.set_ylabel('Match Rating', fontsize=13)
    ax.grid(True, linestyle='--', alpha=0.4)

# --- Colormap Normalizer ---
def get_skill_normalizer(df):
    return Normalize(vmin=df['true_skill'].min(), vmax=df['true_skill'].max())


def plot_regression_with_highlighted_groups(df, best, worst, avg, figsize=(13, 7)):
    import matplotlib.pyplot as plt
    from sklearn.linear_model import LinearRegression

    # Create a column to mark the group
    df['Group'] = 'Other'
    df.loc[best.index, 'Group'] = 'Best'
    df.loc[worst.index, 'Group'] = 'Worst'
    df.loc[avg.index, 'Group'] = 'Average'

    # Define color mapping
    group_colors = {
        'Best': 'green',
        'Average': 'blue',
        'Worst': 'red',
        'Other': 'gray'
    }

    # Dot size mapping based on true_skill (normalized)
    min_size, max_size = 40, 140
    norm = get_skill_normalizer(df)
    df['size'] = df['true_skill'].apply(norm) * (max_size - min_size) + min_size

    # Prepare regression line
    X = df[['rating_fh']].values
    y = df['rating_sh'].values
    model = LinearRegression().fit(X, y)
    slope = model.coef_[0]
    intercept = model.intercept_

    x_vals = np.linspace(df['rating_fh'].min(), df['rating_fh'].max(), 100)
    y_vals = model.predict(x_vals.reshape(-1, 1))

    # Start plotting
    fig, ax = plt.subplots(figsize=figsize)

    # Plot each group
    for group in ['Other', 'Best', 'Average', 'Worst']:
        subset = df[df['Group'] == group]
        ax.scatter(
            subset['rating_fh'],
            subset['rating_sh'],
            s=subset['size'],
            c=group_colors[group],
            label=group if group != 'Other' else None,
            alpha=0.75,
            edgecolors='k' if group != 'Other' else 'none'
        )

    # Plot regression line
    ax.plot(x_vals, y_vals, color='black', linewidth=2, linestyle='-', label=f'Regression Line\n(slope = {slope:.2f})')

    # 45° reference line
    ax.plot(x_vals, x_vals, color='gray', linestyle='--', label='y = x (no regression)')

    # Axis & style
    ax.set_title('Regression: First Half Predicts Second Half', fontsize=16, weight='bold')
    ax.set_xlabel('First Half Rating', fontsize=13)
    ax.set_ylabel('Second Half Rating', fontsize=13)
    ax.set_xlim(3, 10)
    ax.set_ylim(3, 10)
    ax.grid(True, linestyle='--', alpha=0.4)

    # Build legend manually
    from matplotlib.lines import Line2D
    handles = [
        Line2D([0], [0], marker='o', color='w', label='Best Performers\n(Top 10 from First Half)', markerfacecolor='green', markersize=10),
        Line2D([0], [0], marker='o', color='w', label='Average Performers\n(Around Mean in First Half)', markerfacecolor='blue', markersize=10),
        Line2D([0], [0], marker='o', color='w', label='Worst Performers\n(Bottom 10 from First Half)', markerfacecolor='red', markersize=10),
        Line2D([0], [0], marker='o', color='gray', label='Other Players', markersize=10),
        Line2D([0], [0], color='black', lw=2, label=f'Regression Line (slope={slope:.2f})'),
        Line2D([0], [0], color='gray', linestyle='--', lw=1.5, label='y = x (No Regression)'),
        Line2D([0], [0], marker='o', color='w', label='Dot Size ~ True Skill', markerfacecolor='gray', markersize=14)
    ]
    ax.legend(handles=handles, loc='lower right', fontsize=11)

    plt.tight_layout()
    return fig, ax
