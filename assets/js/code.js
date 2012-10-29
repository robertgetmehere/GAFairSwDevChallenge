var gmh = {

    /*
     *
     * a simple increasing series is a polynomial of the form y = Ax^2+Bx+C
     * whilst this series can be analytically determined through inspection
     * examining the gradient dy/dx is the easiest way to find the answer in code
     *
     * y=Bx+C has constant gradient B
     * y=Ax^2+Bx+C has gradient 2Ax+B
     *
     */

    /** SET UP **/
    initialize: function() {
        this.seriesInput = document.getElementById('seriesInput');
        this.seriesOutput = document.getElementById('seriesOutput');
        this.procSeries = document.getElementById('procSeries');
        this.procSeries.onclick = this.procInput;
        this.hasError = true;
        this.output = {};
        this.series = {a:0,b:0,c:0,t:0};
        this.arrSeries = null;
    },

    /** SERIES FUNCTIONS **/
    procInput: function() {
        gmh.output = {};
        gmh.series = {a:0,b:0,c:0,t:0};
        gmh.arrSeries = null;
        gmh.htmlOut('');
        console.log('step 1: validate input');

        if (gmh.validateInput()) {
            gmh.showLoading();

            console.log('step 2: find series');

            if (gmh.findSeries()) {


                switch(gmh.series.t) {
                    case 2:
                        //first test to see if we got a result
                        if (gmh.series.b != null) {

                            //write out equation in written form Ax^2+Bx+C
                            gmh.htmlOut('series is y=' + gmh.series.a + 'x<sup>2</sup>' + (gmh.series.b > 0 ? '+' : '') + (gmh.series.b != 0 ? gmh.series.b + 'x' : '') + (gmh.series.c > 0 ? '+' : '' ) + gmh.series.c);
                            gmh.getNextTen();
                        } else {
                            gmh.htmlOut('I tried 100 iterations and am stopping so I don\'t blow your browser');
                        }
                        break;
                    case 1:
                        //series is first order - write out series in written form Bx+C
                        gmh.htmlOut('series is y=' + gmh.series.b + 'x' + (gmh.series.c > 0 ? '+' : '') + gmh.series.c);
                        gmh.getNextTen();
                        break;
                    default:
                        gmh.htmlOut('almost - I think I found a series but haven\'t figured it out properly');
                }

            } else {
                //output message if series could not be found at all
                gmh.htmlOut('real shame - I couldn\'t work this one out at all');
            }
        } else {
            gmh.htmlOut('I need 3 comma separated numbers<br/>please try again');
        }
    },
    getNextTen: function() {
        var out='';
        for (var i=this.arrSeries.length+1;i<this.arrSeries.length+11;i++) {
            switch(this.series.t) {
                case 2:
                    out+=(this.series.a*i*i)+(this.series.b*i)+this.series.c;
                    break;
                case 1:
                    out+=this.series.b*i+this.series.c;
                    break;
                default:
            }
            out +=',';
            out += (i==this.arrSeries.length+5) ? '<br/>' : '';

        }
        out = out.substring(0,out.length-1);
        this.htmlOut(this.seriesOutput.innerHTML + '<br><br>next ten values are<br>' + out);
    },
    findSeries: function() {
        console.log('test for first order series and return if true');

        if (this.seriesIsFirstOrder()) return true;

        console.log('test for second order series and return if true');

        if (this.seriesIsSecondOrder()) return true;

        return false;
    },
    getDeltas: function(series) {
        var deltas = new Array();
        for (var i=0;i<series.length-1;i++) {
            deltas.push(series[i+1] - series[i]);
        }
        return deltas;
    },
    getDiffs: function(iteration,sample,actual) {
        var deltas = new Array();
        for (var i=0;i<sample.length-1;i++) {
            deltas.push(new Array(iteration,sample[i]-actual[i]));
        }
        return deltas;
    },
    seriesIsFirstOrder: function() {

        //gradient of Bx+C = B - so deltas between points are constant

        var out = false;

        //get gradients between each point in series

        var grad = this.getDeltas(this.arrSeries);

        //if grad[1] == grad[0] then gradient is constant

        if (grad[1] == grad[0]) out= true;

        //set properties of series equation

        if (out){
            this.series.t = 1;                                  //type is first order
            this.series.b = grad[0];                            //B is the gradient
            this.series.c = this.arrSeries[0]-this.series.b;    //intercept is first val of series (y=0) minus B(x=1)
            return out;
        } else {
            return out;
        }
    },
    seriesIsSecondOrder: function() {

        //gradient of Ax^2+Bx+C == 2Ax+B so deltas between points have a first order equation

        var out=false;
        var grad = this.getDeltas(this.arrSeries);
        var grad2 = this.getDeltas(grad);

        //try the special case where B = 0 (gradient = 2A)
        this.series.a =grad2[1]/2;

        //in which case the intercept is the first value in the series
        this.series.c = parseInt(this.arrSeries[0]);

        //now work iterate a value for B - this isn't full polynomial regression
        //put in polynomial regression if have time
        //B could be positive or negative so do a quick check with B as positive
        //first step is to create a sample data set

        var diffs=new Array();
        for (var b=0;b<3;b++) {
            var testVal = new Array();
            for (var x=0;x<this.arrSeries.length;x++) {
                testVal.push(this.series.a*(x*x)+(b*x)+this.series.c);
            }
            diffs.push(this.getDiffs(b,testVal,this.arrSeries));
        }

        //If the deltas between a test series and the real series get worse
        //for increasing positive B then B is negative - check for this
        //it doesn't give us the answer but does reduce the number of iterations
        //we need to find the answer by reducing the scope of the possible solution space

        var bIsPlus = false;
        if (
                (diffs[2][2][1] < diffs[2][1][1])
                    &&
                (diffs[2][2][1] < diffs[1][1][1])
            ) {
            bIsPlus = true; //deltas get smaller so increase increment for test
        }


        //setup iteration to calculate difference between iterated value for B

        b=0;
        var bStart = 0;
        diffs = [];
        while (!out) {

            var testVal = new Array();
            for (var x=0;x<this.arrSeries.length;x++) {
                testVal.push(this.series.a*(x*x)+(b*x)+this.series.c);
            }
            //calculate differences between series with estimated value of B
            //and actual series input by the user

            diffs.push(this.getDiffs(Math.abs(b),testVal,this.arrSeries));
            var hasMatch = false;

            //if the differences are zero for consecutive values then B is correct

            for (var i=0;i<this.arrSeries.length-2;i++) {
                if (diffs[Math.abs(b)][i][1] == 0 && diffs[Math.abs(b)][i+1][1]==0) out = true;
            }
            if (!out) {
                if (bIsPlus) {b++;} else {b--;} //if B is positive number increment B by +1 if not by -1
            }

        }
        //if found B then set series type (t) to second order and set the value of B found

        if (out){
            this.series.t=2;
            this.series.b = b;
            return out;
        } else {
            return out;
        }
        //add a fail safe to stop iterating after a 100 attempts

        if (Math.abs(b) - bStart > 100) {out=true;this.series.b = null;}

    },


    /** UTILITY FUNCTIONS **/
    validateInput: function() {
        //check if input value is empty
        if (this.seriesInput.value.length > 0) {

            //if not empty then trim spaces

            this.seriesInput.value.replace(/\s/g, '');

            //if series is comma separated as requested then split into array
            //using comma as the separator

            if (this.seriesInput.value.indexOf(',') > 0) {
                this.arrSeries = this.seriesInput.value.split(',');
                if (this.arrSeries.length == 0 || typeof this.arrSeries == 'undefined') {
                    return false;
                } else {
                    //we need a minimum of 3 values to calculate 2 dy/dx
                    if (this.arrSeries.length < 3) {
                        return false;
                    } else {
                        return true;
                    }
                }
            } else {

            }
        } else {
            return false;
        }
    },

    //utility function to set up output messages

    htmlOut:function(msg) {
        this.output = {msg:msg};
        this.showError();
    },

    //utility function to set up loading image for duration of calculation

    showLoading:function() {
        this.seriesOutput.style.backgroundImage = 'url(\'../img/loader_40x40.gif\')';
    },

    //utility function to remove loading image when calculation complete

    hideLoading:function() {
        this.seriesOutput.style.backgroundImage = 'url(\'\')';
    },

    //utility function to render output messages on the screen

    showError: function(){
        if (this.output.msg.length > 0) {
            this.hideLoading();
            this.seriesOutput.innerHTML = this.output.msg;
        }
    }

}

gmh.initialize();
