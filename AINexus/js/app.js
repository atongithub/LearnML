document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------
    // Tab Navigation Logic
    // -----------------------------------------------------
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.lab-section');
    const analyticsPanels = document.querySelectorAll('.analytics-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            analyticsPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');
            
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Toggle corresponding analytics panel
            const analyticsIdMap = {
                'supervised-lab': 'analytics-supervised',
                'unsupervised-lab': 'analytics-unsupervised',
                'rl-arena': 'analytics-rl'
            };
            const targetAnalyticsId = analyticsIdMap[targetId];
            if(document.getElementById(targetAnalyticsId)) {
                document.getElementById(targetAnalyticsId).classList.add('active');
            }
        });
    });

    // -----------------------------------------------------
    // UI Interactions specific to labs (not logic)
    // -----------------------------------------------------
    
    // K-Means Slider update
    const kInput = document.getElementById('k-value');
    const kDisplay = document.getElementById('k-value-display');
    const kStatDisplay = document.getElementById('stat-k-clusters');
    
    if(kInput) {
        kInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if(kDisplay) kDisplay.textContent = val;
            if(kStatDisplay) kStatDisplay.textContent = val;
        });
    }
});
