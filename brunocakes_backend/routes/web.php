<?php

use Illuminate\Support\Facades\Route;

// routes/web.php

Route::get('/{any}', function () {
    return view('app'); // view que carrega seu build React
})->where('any', '.*');
