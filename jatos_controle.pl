% Controle dos jatos
:- module(jatos_controle, [vez/5]).

% deve existir um arquivo com o nome "jato0.pl" ou "jato0.pro" com o predicado obter_controles/2
:- use_module(jato0, [obter_controles/4 as obter_controles0]).

% deve existir um arquivo com o nome "jato1.pl" ou "jato1.pro" com o predicado obter_controles/2
:- use_module(jato1, [obter_controles/4 as obter_controles1]).

%Exemplo de mais um
%:- use_module(jato2, [obter_controles/4 as obter_controles2]).

% sempre deve-se iniciar pelo zero (0)
vez(0, SENSORES, ADVERSARIOS, MISSEIS, CONTROLES) :- obter_controles0(SENSORES, ADVERSARIOS, MISSEIS, CONTROLES).
vez(1, SENSORES, ADVERSARIOS, MISSEIS, CONTROLES) :- obter_controles1(SENSORES, ADVERSARIOS, MISSEIS, CONTROLES).
%Exemplo de mais um
%vez(2, SENSORES, ADVERSARIOS, MISSEIS, CONTROLES) :- obter_controles2(SENSORES, ADVERSARIOS, MISSEIS, CONTROLES).

