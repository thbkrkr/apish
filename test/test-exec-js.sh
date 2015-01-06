curl -H 'Content-type: application/json' -XPOST "http://apishh.herokuapp.com/!/js" -d '{
  "data": [
    { "pof": 3}
  ],
  "script": "var pof = data[0].pof*2, data = Math.log(Math.random())+Math.random()*pof; return {pof: pof, data: data}"
}' -w "\ntime=%{time_total}s"
