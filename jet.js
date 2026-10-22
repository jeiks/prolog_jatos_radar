class Jet {
    constructor(x, y,
                width, height,
                arenaheight, arenawidth,
                controlType, maxSpeed = 3,
                color = "lightBlue",
                score = 100,
                prologID = -1,
                name = "Humano",
                timeForUpdateProlog = 100
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.color = color;
        this.prologID = prologID;
        this.arenaleft = 0;
        this.arenatop = 0;
        this.arenawidth = arenawidth;
        this.arenaheight = arenaheight;
        this.worldWidth = this.arenawidth - this.arenaleft;
        this.worldHeight = this.arenaheight - this.arenatop;
        this.speed = 0.3;
        this.acceleration = 0.05;
        this.maxSpeed = maxSpeed;
        this.angle = 0;
        this.controlType = controlType;
        this.steps = 0;
        this.smallSteps = 0;
        this.score = score;
        this.alreadyDrawed = false;
        this.controls = new Controls(controlType, timeForUpdateProlog);
        this.rad = Math.hypot(this.width,this.height)/2;
        this.alpha = Math.atan2(this.width,this.height);
        this.polygon = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
        [this.img, this.mask] = this.#getJetImg(color);
        [this.img2, this.mask2] = this.#getJetImg("black");
        this.shadow=this.#createShadowCanvas();
    }

    #getJetImg(color) {
        const img = new Image();
        img.src = (this.controlType == "DUMMY") ? "airplane_dummy.png" : "airplane.png";
        const mask = document.createElement("canvas");
        mask.width = this.width;
        mask.height = this.height;
        const maskCtx = mask.getContext("2d");
        img.onload = () => {
            maskCtx.clearRect(0, 0, this.width, this.height);
            maskCtx.globalCompositeOperation = "source-over";
            maskCtx.fillStyle = color;
            maskCtx.fillRect(0, 0, this.width, this.height);
            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(img, 0, 0, this.width, this.height);
            maskCtx.globalCompositeOperation = "source-over";
        };
        return [img, mask];
    }

    #createShadowCanvas() {
        const canvas=document.createElement("canvas");
        canvas.width=this.width;
        canvas.height=this.height;
        return canvas;
    }

    #prepareShadow(mask) {
        const shadowCtx=this.shadow.getContext("2d");
        shadowCtx.clearRect(0,0,this.width,this.height);
        shadowCtx.filter="blur(3px)";
        shadowCtx.globalAlpha=0.28;
        shadowCtx.drawImage(mask,0,0);
        shadowCtx.filter="none";
        shadowCtx.globalAlpha=1;
    }

    update(jets, booms) {
        if (this.score > 0) {
            switch (this.controlType) {
                case "PROLOG":
                    this.controls.updateProlog(this.x, this.y, this.angle, this.prologID, this.score, this.speed, jets, booms, this);
                    break;
                case "DUMMY":
                    this.controls.updateDUMMYKeys();
                    break;
                case "KEYS":
                    break;
            }
            this.#move();
        } else {
            this.img=this.img2;
            this.mask=this.mask2;
        }

        this.#createPolygon();

        if (this.#boomDamage(booms))
            this.score = Math.max(this.score-10, 0);

        return [this.controls.getBOOM() && (this.score > 0), this.x, this.y, this.angle];
    }

    // DANO POR MÍSSIL
    #boomDamage(booms) {
        for (let i=0;i<booms.length;i++) {
            const boom=booms[i];
            const dx=this.x-boom.x;
            const dy=this.y-boom.y;
            const limit=this.width+boom.size+4;
            if (dx*dx+dy*dy<=limit*limit && polysIntersect(this.polygon,boom.getCircle())) {
                boom.deactivate();
                return true;
            }
        }
        return false;
    }

    #createPolygon() {
        const a=this.angle, r=this.rad, al=this.alpha;
        this.polygon[0].x=this.x-Math.sin(a-al)*r;
        this.polygon[0].y=this.y-Math.cos(a-al)*r;
        this.polygon[1].x=this.x-Math.sin(a+al)*r;
        this.polygon[1].y=this.y-Math.cos(a+al)*r;
        this.polygon[2].x=this.x-Math.sin(Math.PI+a-al)*r;
        this.polygon[2].y=this.y-Math.cos(Math.PI+a-al)*r;
        this.polygon[3].x=this.x-Math.sin(Math.PI+a+al)*r;
        this.polygon[3].y=this.y-Math.cos(Math.PI+a+al)*r;
    }

    #move() {
        if (this.controls.forward)
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);

        if (this.controls.reverse)
            this.speed = Math.max(this.speed - this.acceleration, 0.3);

        if (this.speed > this.maxSpeed)
            this.speed = this.maxSpeed;

        if (this.speed < 0.3)
            this.speed = 0.3;

        const flip=this.speed>0?1:-1;
        if (this.controls.left)  this.#updateAngle(this.angle + 0.03 * flip);
        if (this.controls.right) this.#updateAngle(this.angle - 0.03 * flip);

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
        this.#wrapPosition();
    }

    // move entre os cantos da tela
    #wrapPosition() {
        while (this.x > this.arenawidth)
            this.x -= this.worldWidth;

        while (this.x < this.arenaleft)
            this.x += this.worldWidth;

        while (this.y > this.arenaheight)
            this.y -= this.worldHeight;

        while (this.y < this.arenatop)
            this.y += this.worldHeight;
    }

    // curvatura do jato
    #updateAngle(newAngle) {
        newAngle = newAngle % (Math.PI * 2);
        if (newAngle < 0) newAngle += Math.PI * 2;
        this.angle = newAngle;
    }

    // desenha o jato
    draw(ctx) {
        this.#drawJetAt(ctx, this.x, this.y);
        const halfW = this.width / 2, halfH = this.height / 2;

        // Esquerda / direita
        if (this.x - halfW < this.arenaleft)
            this.#drawJetAt(ctx, this.x + this.worldWidth, this.y);

        if (this.x + halfW > this.arenawidth)
            this.#drawJetAt(ctx, this.x - this.worldWidth, this.y);

        // Cima / Baixo
        if (this.y - halfH < this.arenatop)
            this.#drawJetAt(ctx, this.x, this.y + this.worldHeight);

        if (this.y + halfH > this.arenaheight)
            this.#drawJetAt(ctx, this.x, this.y - this.worldHeight);

        // CANTOS
        if (this.x - halfW < this.arenaleft && this.y - halfH < this.arenatop)
            this.#drawJetAt(ctx, this.x + this.worldWidth, this.y + this.worldHeight);

        if (this.x + halfW > this.arenawidth && this.y - halfH < this.arenatop)
            this.#drawJetAt(ctx, this.x - this.worldWidth, this.y + this.worldHeight);

        if (this.x - halfW < this.arenaleft && this.y + halfH > this.arenaheight)
            this.#drawJetAt(ctx, this.x + this.worldWidth, this.y - this.worldHeight);

        if (this.x + halfW > this.arenawidth && this.y + halfH > this.arenaheight)
            this.#drawJetAt(ctx, this.x - this.worldWidth, this.y - this.worldHeight);

    }

    // desenha o jato
    #drawJetAt(ctx, x, y) {
        const baseTilt = 0.3, verticalScale = 0.8;
        // FATOR DE INCLINAÇÃO
        const cr =this.controls.right, cl=this.controls.left, speedFactor = this.speed;
        const tiltFactor = Math.max(-baseTilt,Math.min(baseTilt, (cr-cl)*baseTilt*speedFactor));
        // SOMBRA
        ctx.save();
        // Deslocamento da sombra.
        ctx.translate(x + 5.6, y + 8.4);
        //A sombra acompanha a rotação do avião.
        ctx.rotate(-this.angle);
        // Mesmo efeito geométrico do jato.
        ctx.transform(1, tiltFactor, 0, verticalScale, 0, 0);
        // Transparência da sombra.
        ctx.globalAlpha = 0.28;
        // Blur suave.
        ctx.filter = "blur(3px)";
        // Máscara preta.
        ctx.drawImage(this.mask2, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.filter = "none";
        ctx.restore();

        // JATO
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-this.angle);
        ctx.transform(1, tiltFactor, 0, verticalScale, 0, 0);
        // Máscara colorida.
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(this.mask, -this.width / 2, -this.height / 2, this.width, this.height);
        // Imagem original.
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();

        // SCORE
        this.#drawScore(ctx, x, y);
        //this.#drawName(ctx, x, y);
    }

    // desenha o Score
    #drawScore(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        const scoreY = this.height * 0.62;
        const boxWidth = 34;
        const boxHeight = 17;
        const radius = 5;
        ctx.fillStyle = "rgba(0,0,0,0.58)";
        ctx.beginPath();
        ctx.roundRect(-boxWidth / 2, scoreY - boxHeight / 2, boxWidth, boxHeight, radius);
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = this.score > 20 ? "white" : "#ff4040";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const scoreText = String(Math.max(0, Math.round(this.score)));
        ctx.fillText(scoreText, 0, scoreY);
        if (this.score <= 20) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 0.2;
            ctx.strokeText(scoreText, 0, scoreY);
        }
        ctx.restore();
    }

    // desenha o Score
    #drawName(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.font = "bold 11px Arial";
        const scoreY = this.height * 0.90;
        const boxWidth = ctx.measureText(this.name).width+5;
        const boxHeight = 17;
        const radius = 5;
        ctx.fillStyle = "rgba(0,0,0,0.58)";
        ctx.beginPath();
        ctx.roundRect(-boxWidth / 2, scoreY - boxHeight / 2, boxWidth, boxHeight, radius);
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, 0, scoreY);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.2;
        ctx.strokeText(this.name, 0, scoreY);
        ctx.restore();
    }
}
