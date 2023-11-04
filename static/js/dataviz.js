var innerRadius = [40, 75, 110, 145]; // adjust the inner and outer radius from here
var outerRadius = [70, 105, 140, 175];
var color = ["#1F77B4", "#5199E4", "#78C2ED", "#A7DAF8"]; // adjust colors from here
var label = ["INVESTMENTS", "SAVINGS", "EXPENDITURE", "INCOME"]; // add labels here

const app = new Vue({
  el: "#app",
  data: {
    data: [],
    isNoRecordsFound: false,
  },
  async mounted() {
    try {
      const credentialId = window.localStorage.getItem('username');
      if (credentialId) {
        await this.getUserInfo(credentialId);
        try {
          var sum = d3.sum(this.data);

          var width = 400; // adjust the width of the SVG
          var height = 400; // adjust the height of the SVG

          var svg = d3
            .select("#visualization")
            .append("svg")
            .attr("viewBox", `0 0 ${ width } ${ height }`)
            .attr("preserveAspectRatio", "xMidYMid meet");

          var arc = d3
            .arc()
            .innerRadius(function (d, i) {
              return innerRadius[i];
            })
            .outerRadius(function (d, i) {
              return outerRadius[i];
            })
            .startAngle(0)
            .endAngle(0) // Set initial end angle to 0
            .cornerRadius(10);

          var group = svg
            .selectAll("g")
            .data(this.data)
            .enter()
            .append("g")
            .attr("transform", `translate(${ width / 2 }, ${ height / 2 })`);

          group
            .append("text")
            .attr("y", function (d, i) {
              return -(innerRadius[i] + outerRadius[i]) / 2;
            })
            .attr("dy", "0.35em")
            .attr("x", -50)
            .text(function (d, i) {
              return label[i];
            })
            .attr("opacity", 0)
            .transition()
            .duration(1000)
            .delay(function (d, i) {
              return i * 200;
            })
            .attr("opacity", 1)
            .attr("text-anchor", "end")
            .attr("font-size", 15)
            .attr("font-weight", "bold")
            .attr("font-family", "Arial, Helvetica, sans-serif")
            .attr("fill", function (d, i) {
              return color[i];
            });

          group
            .append("path")
            .attr("d", arc)
            .attr("fill", function (d, i) {
              return color[i];
            })
            .attr("opacity", 0)
            .transition()
            .duration(1000)
            .delay(function (d, i) {
              return i * 200;
            })
            .attrTween("d", function (d, i) {
              var interpolate = d3.interpolate(0, (d / sum) * 1.5 * Math.PI); // Interpolate between 0 and final end angle
              return function (t) {
                arc.endAngle(interpolate(t)); // Update the end angle of the arc
                return arc(d, i);
              };
            })
            .attr("opacity", 1);
        } catch (err) {
          console.log(err);
        }
      } else {
        console.log('User not authenticated');
      }
    } catch (error) {
      console.error('Failed to fetch user info on mount:', error);
    }
  },
  methods: {
    async getUserInfo(credentialId) {
      try {
        const response = await fetch('/api/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentialId }),
        });

        if (response.ok) {
          const res = await response.json();
          // console.log({ res });
          const user = res.user;

          this.data = [user.Investments, user.Savings, user.Expenses, user.Income];

          if (user.Investments === 0 && user.Savings === 0 && user.Expenses === 0 && user.Income == 0) {
            this.isNoRecordsFound = true;
            return; // Exit the function
          }
          this.labelsOpacity = 1;
          this.pathOpacity = 1;
        } else {
          console.error(response.statusText);
          throw new Error(response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        throw new Error(error);
      }
    },
  },
});
