/*
in ../aws_credentials.js, put something like:
var AWS_ACCESS_KEY = 'my_key';
var AWS_SECRET_KEY = 'my_secret_key';
*/

AWS.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});
AWS.config.region = 'us-east-1';
var cloudwatch = new AWS.CloudWatch();

var start_time = new Date();
var end_time = new Date();
start_time.setHours(end_time.getHours() - 1);
var last_end_time = end_time;

/*
Metrics:

AWS/AutoScaling 
  AutoScalingGroupName thevent-test-1-WebServerGroup-1U7GSGD2TUB0V
  Metric Name: GroupTotalInstances; GroupPendingInstances; GroupTerminatingInstances; GroupInServiceInstances

AWS/EC2
InstanceId: <instance ID>
CPUUtilization; DiskReadOps; DiskWriteOps; NetworkIn; NetworkOut; StatusCheckFailed

AWS/ELB
LoadBalancerName: melvil-prod
BackendConnectionErrors; HTTPCode_Backend_[2|3|4|5]XX; HTTPCode_ELB_[4|5]XX; HealthyHostCount; Latency; RequestCount; SurgeQueueLength
*/

$(document).ready(function() {
    var contentdiv = $('#content');
    var params = {
	EndTime: end_time, /* required */
	MetricName: 'Latency', /* required */
	Namespace: 'AWS/ELB', /* required */
	Period: 60, /* required */
	StartTime: start_time, /* required */
	Statistics: [ /* required */
	    'Average',
	    /* more items - Average | Sum | SampleCount | Maximum | Minimum */
	],
	Dimensions: [
	    {
		Name: 'LoadBalancerName', /* required */
		Value: 'melvil-prod' /* required */
	    },
	    /* more items */
	],
	Unit: 'Seconds' /* 'Seconds | Microseconds | Milliseconds | Bytes | Kilobytes | Megabytes | Gigabytes | Terabytes | Bits | Kilobits | Megabits | Gigabits | Terabits | Percent | Count | Bytes/Second | Kilobytes/Second | Megabytes/Second | Gigabytes/Second | Terabytes/Second | Bits/Second | Kilobits/Second | Megabits/Second | Gigabits/Second | Terabits/Second | Count/Second | None' */
    };
    cloudwatch.getMetricStatistics(params, function(err, data) {
	if (err) console.log(err, err.stack); // an error occurred
	else     dataObjToPoints(data);           // successful response
    });
});

function sortByKey(array, key) {
    return array.sort(function(a, b) {
	var x = a[key]; var y = b[key];
	return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function dataObjToPoints(data) {
    result = [ ];
    points = sortByKey(data.Datapoints, 'Timestamp');
    for (var i = 0; i < points.length; i++) {
	point = points[i];
	/* console.log(point); */
	val = {x: (point.Timestamp.getTime() / 1000), y: point.Average};
	console.log(val);
	result.push(val);
    }
    console.log(result);

    /* graph it */

    var graph = new Rickshaw.Graph({
	element: document.querySelector("#chart"),
	width: 1200,
	height: 200,
	renderer: 'line',
	series: [{
	    data: result,
	    color: '#4682b4'
	}]
    });
    console.log("calling render");
    var x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );
    var y_axis = new Rickshaw.Graph.Axis.Y( {
	graph: graph,
	orientation: 'left',
	tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
	element: document.getElementById('y_axis'),
    } );
    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
	graph: graph,
	xFormatter: function(x) { return x + " timestamp" },
	yFormatter: function(y) { return y + " seconds" }
    } );
    graph.render();
    console.log("called render");
}
